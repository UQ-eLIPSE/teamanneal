import axios, { AxiosPromise, AxiosResponse, AxiosError, CancelTokenSource } from "axios";

import { reverse } from "../util/Array";

import * as Record from "../../../common/Record";
import * as Stratum from "../../../common/Stratum";
import * as Constraint from "../../../common/Constraint";
import * as SourceData from "../../../common/SourceData";
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
    /** Holds the "request completed" flag for each AnnealRequest */
    const RequestCompletionTable = new WeakMap<Data, boolean>();

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

        // Manage the completion flag (initially false; handler manages it when
        // complete)
        SetCompleted(annealRequestObject, false);
        AttachCompletionHandler(annealRequestObject);

        return annealRequestObject;
    }

    export function ConvertStateToAnnealRequestBody(state: IState) {
        // =====================================================================
        // Source data (Partitions and columns)
        // =====================================================================

        // Form partitions
        const stateStrata = state.annealConfig.strata;
        const stateColumns = state.recordData.columns;
        const partitionColumnDescriptor = state.recordData.partitionColumn;

        const statePartitions = Partition.InitManyFromPartitionColumnDescriptor(stateColumns, partitionColumnDescriptor);

        // Convert columns into rows
        const records = statePartitions.map(partition => ColumnData.TransposeIntoCookedValueRowArray(partition.columns));

        // Map the column info objects into just what we need for the request
        const idColumn = state.recordData.idColumn;

        if (idColumn === undefined) {
            throw new Error("No ID column set");
        }

        const columns = stateColumns.map((column) => {
            const columnDesc: SourceDataColumn.ColumnDesc = {
                label: column.label,
                type: column.type,
                isId: ColumnData.Equals(idColumn, column),
            }

            return columnDesc;
        });

        // Compile the source data object
        const sourceData: SourceData.Desc = {
            columns,
            records,
            isPartitioned: true,    // We have partitioned the data above regardless
        };

        // =====================================================================
        // Strata
        // =====================================================================

        // We get the strata in reverse order because the internal
        // strata object is currently ordered:
        //      [highest, ..., lowest]
        // rather than:
        //      [lowest, ..., highest]
        // which is what the server receives as input to the anneal endpoint.
        const strataServerOrder = reverse(stateStrata);

        const strata =
            strataServerOrder.map(({ label, size }) => {
                const stratum: Stratum.Desc = {
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

                            strata: stratumIndex,

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

                            strata: stratumIndex,

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

                            strata: stratumIndex,

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
            sourceData,
            strata,
            constraints,
            config: {
                // TODO: This entire block is dummy data;
                // The config parameters are currently unused and will be cleaned up in TA-52
                iterations: 0,
                returnAllData: true,
            },
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
                SetCompleted(annealRequest, true);
                SetResponse(annealRequest, response);
            });
    }

    function SetCompleted(annealRequest: Data, completed: boolean) {
        return RequestCompletionTable.set(annealRequest, completed);
    }

    export function GetCompleted(annealRequest: Data) {
        const completed = RequestCompletionTable.get(annealRequest);

        if (completed === undefined) {
            throw new Error("Completion flag entry was not found");
        }

        return completed;
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
