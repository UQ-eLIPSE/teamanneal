import axios, { AxiosPromise, AxiosResponse, AxiosError, CancelTokenSource } from "axios";

import { reverse } from "../util/Array";
import * as UUID from "../util/UUID";

import * as Record from "../../../common/Record";
import * as Stratum from "../../../common/Stratum";
import * as AnnealNode from "../../../common/AnnealNode";
import * as Constraint from "../../../common/Constraint";
import * as RecordData from "../../../common/RecordData";
import * as SourceDataColumn from "../../../common/SourceDataColumn";
import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";

import { Data as IState } from "./State";
import { Partition } from "./Partition";
import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";

export interface Data {
    request: {
        time: number,

        object: AxiosPromise,
        cancelTokenSource: CancelTokenSource,

        body: ToServerAnnealRequest.Root,
    },
}

export type AxiosResponse = AxiosResponse;
export type AxiosError = AxiosError;

export namespace AnnealRequest {
    /** Holds the AJAX response for each AnnealRequest */
    const RequestResponseStore = new WeakMap<Data, AxiosResponse | AxiosError>();

    function Init(
        requestObject: AxiosPromise,
        cancelTokenSource: CancelTokenSource,
        requestBody: ToServerAnnealRequest.Root) {
        const annealRequestObject: Data = {
            request: {
                time: Date.now(),

                object: requestObject,
                cancelTokenSource,

                body: requestBody,
            },
        };

        return annealRequestObject;
    }

    export function InitFromState(state: IState) {
        // Translate state into request body and create AJAX request
        const body = ConvertStateToAnnealRequestBody(state);
        const { request, cancelTokenSource } = CreateAnnealAjaxRequest(body);

        // Create AnnealRequest object
        const annealRequestObject = Init(request, cancelTokenSource, body);

        // Attach completion handler so that the response is handled 
        // appropriately
        AttachCompletionHandler(annealRequestObject);

        return annealRequestObject;
    }

    export function ConvertStateToAnnealRequestBody(state: IState) {
        // =====================================================================
        // Record data
        // =====================================================================

        const stateColumns = state.recordData.columns;
        // Convert columns into rows
        const records = ColumnData.TransposeIntoCookedValueRowArray(stateColumns);

        // Map the column info objects into just what we need for the request
        const idColumn = state.recordData.idColumn;

        if (idColumn === undefined) {
            throw new Error("No ID column set");
        }

        // Keep track of the ID column
        let idColumnIndex: number | undefined = undefined;

        const columns = stateColumns.map((column, i) => {
            const isId = ColumnData.Equals(idColumn, column);

            if (isId) {
                if (idColumnIndex === undefined) {
                    idColumnIndex = i;
                } else {
                    throw new Error("Two or more ID columns found");
                }
            }

            const columnDesc: SourceDataColumn.ColumnDesc = {
                label: column.label,
                type: column.type,
                isId,
            }

            return columnDesc;
        });

        if (idColumnIndex === undefined) {
            throw new Error("No ID columns found");
        }

        // Create record data object
        const recordData: RecordData.Desc = {
            columns,
            records,
        };

        // =====================================================================
        // Anneal nodes
        // =====================================================================

        // Each node represents each partition to anneal over
        const partitionColumnDescriptor = state.recordData.partitionColumn;
        const statePartitions = Partition.InitManyFromPartitionColumnDescriptor(stateColumns, partitionColumnDescriptor);

        // Create anneal nodes from the ID values of each partition
        const annealNodes =
            statePartitions.map((partition) => {
                const recordIds = ColumnData.GenerateCookedColumnValues(partition.columns[idColumnIndex!]);

                // NOTE: This is not yet fully developed as the server-side code 
                // does not use the node tree structure just yet, so we're just 
                // encoding the partition nodes one level down with a node that
                // holds records as an immediate child rather than fully 
                // representing the real tree

                const recordsNode: AnnealNode.NodeStratumWithRecordChildren =
                    {
                        _id: UUID.generate(),
                        type: "stratum-records",
                        recordIds,
                    };

                const rootNode: AnnealNode.NodeRoot =
                    {
                        _id: UUID.generate(),
                        type: "root",
                        children: [recordsNode],
                    };

                return rootNode;
            });


        // =====================================================================
        // Strata
        // =====================================================================

        // We get the strata in reverse order because the internal
        // strata object is currently ordered:
        //      [highest, ..., lowest]
        // rather than:
        //      [lowest, ..., highest]
        // which is what the server receives as input to the anneal endpoint.
        const stateStrata = state.annealConfig.strata;
        const strataServerOrder = reverse(stateStrata);

        const strata =
            strataServerOrder.map(({ _id, label, size }) => {
                const stratum: Stratum.Desc = {
                    _id,
                    label,
                    size,
                };

                return stratum;
            });

        // =====================================================================
        // Constraints
        // =====================================================================

        const convertConstraintValue = (columnDescriptor: IColumnData_MinimalDescriptor, value: Record.RecordElement) => {
            // If the value is a string that falls under a numeric column, then
            // convert it to a number
            if (typeof value === "string" &&
                columnDescriptor.type === "number") {
                return +value;
            }

            return value;
        }

        const stateConstraints = state.annealConfig.constraints;
        const constraints = stateConstraints.map(
            (internalConstraint) => {
                // Get the index of the stratum for the constraint
                const stratumId = internalConstraint.stratum;
                const stratumIndex = strataServerOrder.findIndex(s => s._id === stratumId);

                if (stratumIndex < 0) {
                    throw new Error(`Stratum ${stratumId} does not exist`);
                }

                // Get the index of the filter column
                const filterColumnDescriptor = internalConstraint.filter.column;
                const filterColumnIndex = stateColumns.findIndex(c => ColumnData.Equals(filterColumnDescriptor, c));

                if (filterColumnIndex < 0) {
                    throw new Error(`Column ${filterColumnDescriptor._id} does not exist`);
                }

                // TODO: The below code is copied three times due to TypeScript's
                // strict type checking - it should be combined into one
                switch (internalConstraint.type) {
                    case "count": {
                        const constraint: Constraint.Desc = {
                            type: internalConstraint.type,
                            weight: internalConstraint.weight,

                            stratum: internalConstraint.stratum,

                            filter: {
                                column: filterColumnIndex,
                                function: internalConstraint.filter.function,
                                values: internalConstraint.filter.values
                                    .map((value) => convertConstraintValue(filterColumnDescriptor, value)),
                            },
                            condition: internalConstraint.condition,

                            applicability: internalConstraint.applicability,
                        }

                        return constraint;
                    }

                    case "limit": {
                        const constraint: Constraint.Desc = {
                            type: internalConstraint.type,
                            weight: internalConstraint.weight,

                            stratum: internalConstraint.stratum,

                            filter: {
                                column: filterColumnIndex,
                                function: internalConstraint.filter.function,
                                values: internalConstraint.filter.values
                                    .map((value) => convertConstraintValue(filterColumnDescriptor, value)),
                            },
                            condition: internalConstraint.condition,

                            applicability: internalConstraint.applicability,
                        }

                        return constraint;
                    }

                    case "similarity": {
                        const constraint: Constraint.Desc = {
                            type: internalConstraint.type,
                            weight: internalConstraint.weight,

                            stratum: internalConstraint.stratum,

                            filter: {
                                column: filterColumnIndex,
                            },
                            condition: internalConstraint.condition,

                            applicability: internalConstraint.applicability,
                        }

                        return constraint;
                    }
                }

                throw new Error("Unrecognised constraint type");
            }
        );

        // =====================================================================
        // Request body
        // =====================================================================

        const request: ToServerAnnealRequest.Root = {
            recordData,
            annealNodes,
            strata,
            constraints,
        }

        return request;
    }

    function CreateAnnealAjaxRequest(data: any) {
        // Create a cancellation token
        // This is used in event of overlapping requests
        const cancelTokenSource = axios.CancelToken.source();

        const request = axios.post("/api/anneal", data, {
            cancelToken: cancelTokenSource.token,
        });

        return {
            cancelTokenSource,
            request,
        }
    }

    export function Cancel(annealRequest: Data, message?: string) {
        return annealRequest.request.cancelTokenSource.cancel(message);
    }

    /**
     * Returns a Promise which is satisfied when the request completes (either 
     * success or error)
     */
    export function WaitForCompletion(annealRequest: Data) {
        return new Promise<AxiosResponse | AxiosError>((resolve) => {
            annealRequest.request.object
                .then(resolve)
                .catch(resolve);
        });
    }

    function AttachCompletionHandler(annealRequest: Data) {
        // When the AJAX request completes, set the completion flag to true
        WaitForCompletion(annealRequest)
            .then((response) => {
                SetResponse(annealRequest, response);
            });
    }

    export function GetCompleted(annealRequest: Data) {
        return GetResponse(annealRequest) !== undefined;
    }

    function SetResponse(annealRequest: Data, response: AxiosResponse | AxiosError) {
        return RequestResponseStore.set(annealRequest, response);
    }

    export function GetResponse(annealRequest: Data) {
        return RequestResponseStore.get(annealRequest);
    }

    export function IsRequestSuccessful(annealRequest: Data) {
        const response = GetResponse(annealRequest);

        // Not yet received response, or unknown request
        if (response === undefined) {
            return false;
        }

        // If the "response" is an Error/AxiosError object
        if (response instanceof Error) {
            return false;
        }

        // Otherwise okay
        return true;
    }
}
