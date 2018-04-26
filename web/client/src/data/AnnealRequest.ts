import axios, { AxiosPromise, AxiosResponse, AxiosError, CancelTokenSource } from "axios";

import { reverse, shuffleInPlace } from "../util/Array";
import * as UUID from "../util/UUID";

import * as Record from "../../../common/Record";
import * as Stratum from "../../../common/Stratum";
import * as AnnealNode from "../../../common/AnnealNode";
import * as Constraint from "../../../common/Constraint";
import * as RecordData from "../../../common/RecordData";
import * as RecordDataColumn from "../../../common/RecordDataColumn";
import * as GroupDistribution from "../../../common/GroupDistribution";
import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import { AnnealStatus } from "../../../common/AnnealStatus";
import { AnnealStatusResponseState, StatusMap } from "../../../common/AnnealState";

import { Data as IState } from "./State";
import { Partition } from "./Partition";
import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";

export interface Data {
    time: number,

    object: AxiosPromise,
    cancelTokenSource: CancelTokenSource,

    body: ToServerAnnealRequest.Root,
}

export namespace AnnealRequest {
    function Init(
        requestObject: AxiosPromise,
        cancelTokenSource: CancelTokenSource,
        requestBody: ToServerAnnealRequest.Root) {
        const annealRequestObject: Data = {
            time: Date.now(),

            object: requestObject,
            cancelTokenSource,

            body: requestBody,
        };

        return annealRequestObject;
    }

    export function InitFromState(state: IState) {
        // Translate state into request body and create AJAX request
        const body = ConvertStateToAnnealRequestBody(state);
        const { request, cancelTokenSource } = CreateAnnealAjaxRequest(body);

        // Create AnnealRequest object
        const annealRequestObject = Init(request, cancelTokenSource, body);

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

            const columnDesc: RecordDataColumn.ColumnDesc = {
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
        // Anneal nodes
        // =====================================================================

        // Each node represents each partition to anneal over
        const partitionColumnDescriptor = state.recordData.partitionColumn;
        const statePartitions = Partition.InitManyFromPartitionColumnDescriptor(stateColumns, partitionColumnDescriptor);

        // Create anneal nodes from the ID values of each partition
        const annealNodes =
            statePartitions.map((partition) => {
                // Give records a shuffle before putting it into anneal nodes
                // Note that we're copying the array first before shuffling it
                const idColumnCookedValues = ColumnData.GenerateCookedColumnValues(partition.columns[idColumnIndex!]);
                const shuffledRecordIdValues = shuffleInPlace<number | string | null>(idColumnCookedValues.slice());

                // Remember that we're building from the bottom up (following 
                // the server order) so we need to keep track of array of nodes
                // from the previous run of the loop
                let prevStratumNodes: (AnnealNode.NodeStratumWithRecordChildren | AnnealNode.NodeStratumWithStratumChildren)[] | undefined = undefined;

                // Go through each stratum, and build up nodes
                // Note that is in server order! (Index 0 = leaf/records)
                strata.forEach((stratumDef, serverStratumIndex) => {
                    const { min, ideal, max } = stratumDef.size;

                    const nodes: (AnnealNode.NodeStratumWithRecordChildren | AnnealNode.NodeStratumWithStratumChildren)[] = [];

                    if (serverStratumIndex === 0) {
                        // Leaf node contains records (via their IDs) directly

                        const groupSizeArray = GroupDistribution.generateGroupSizes(shuffledRecordIdValues.length, min, ideal, max, false);

                        groupSizeArray.forEach((groupSize) => {
                            // Init new leaf node with records
                            const stratumRecordNode: AnnealNode.NodeStratumWithRecordChildren = {
                                _id: UUID.generate(),
                                type: "stratum-records",
                                stratum: strata[serverStratumIndex]._id,
                                recordIds: shuffledRecordIdValues.splice(0, groupSize), // "Pop off" the relevant record IDs for this node
                            };

                            nodes.push(stratumRecordNode);
                        });

                        // Shuffled ID column cooked values should be blank
                        // because we've popped off all the records into nodes
                        if (shuffledRecordIdValues.length !== 0) {
                            throw new Error("Records still remaining after node generation; expected none to remain");
                        }

                    } else {
                        // Intermediate nodes simply nest other children nodes

                        if (prevStratumNodes === undefined) {
                            throw new Error("No child nodes found");
                        }

                        const numberOfPrevStratumNodes = prevStratumNodes.length;

                        const groupSizeArray = GroupDistribution.generateGroupSizes(numberOfPrevStratumNodes, min, ideal, max, false);

                        groupSizeArray.forEach((groupSize) => {
                            // Init new intermediate node
                            const stratumNode: AnnealNode.NodeStratumWithStratumChildren = {
                                _id: UUID.generate(),
                                type: "stratum-stratum",
                                stratum: strata[serverStratumIndex]._id,
                                children: prevStratumNodes!.splice(0, groupSize),
                            };

                            nodes.push(stratumNode);
                        });
                    }

                    // Keep references to this set of nodes for the next round
                    prevStratumNodes = nodes;
                });

                // Cap it off with a root node
                const rootChildren = prevStratumNodes;

                if (rootChildren === undefined) {
                    throw new Error("No children found for root node");
                }

                const rootNode: AnnealNode.NodeRoot = {
                    _id: UUID.generate(),
                    type: "root",
                    partitionValue: "" + partition.value,
                    children: rootChildren,
                }

                return rootNode;
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
                            _id: internalConstraint._id,

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
                            _id: internalConstraint._id,

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
                            _id: internalConstraint._id,

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
        };
    }

    export function Cancel(annealRequest: Data, message?: string) {
        return annealRequest.cancelTokenSource.cancel(message);
    }

    /**
     * Returns a Promise which is satisfied when the request completes (either 
     * success or error)
     */
    export function WaitForCompletion(annealRequest: Data) {
        return new Promise<AxiosResponse | AxiosError>((resolve) => {
            annealRequest.object
                .then(resolve)
                .catch(resolve);
        });
    }

    function Sleep(ms: number) {
        return new Promise<void>(r => setTimeout(r, ms));
    }

    // Factory for the wait function
    // Note that `statusCheckAttempts` is a parameter in the factory with a default
    // of 0 - this is to dispense with an additional `let` variable declaration and
    // also has a nice side effect of allowing you to adjust the starting attempts 
    // value if you wanted to
    function AnnealStatusWaitFactory(attempt: number = 0) {
        return () => Sleep(GetRequestTimeout(attempt++));
    }

    /**
     * Handles firing of anneal status query requests
     * @param responseContent Response from server with ID of anneal job
     * @param annealCompleteCallbackFunction Function to be called once anneal job is finished
     */
    export async function QueryAndUpdateAnnealStatus(responseContent: AxiosResponse) {
        const annealId: string = responseContent.data.id;

        const waitFn = AnnealStatusWaitFactory();

        // We'll keep on checking until we know that the anneal is complete
        while (true) {
            // Wait first
            await waitFn();

            // Check status
            const statusResponse = await GetAnnealStatus(annealId);
            const { isAnnealComplete } = GetCompletedPartitionsData(statusResponse.data);

            // Return result when complete
            if (isAnnealComplete) {
                return await GetAnnealResult(annealId);
            }

            // Otherwise the loop goes on to the next cycle
        }
    }

    /**
     * Sends axios POST request with ID of anneal job to get anneal status.
     * @param annealId ID of the anneal job
     */
    export async function GetAnnealStatus(annealId: string) {
        return axios.get("/api/anneal/anneal-status", {
            params: {
                id: annealId
            }
        });
    }

    /**
     * Sends axios POST request with ID of anneal job to retrieve anneal results.
     * @param annealId ID of the anneal job
     */
    export async function GetAnnealResult(annealId: string) {
        return axios.get("/api/anneal/anneal-result", {
            params: {
                id: annealId
            }
        });
    }

    /**
    * Returns a variable timeout (in ms) as a function of the number of attempts made by the client to get anneal status.
    * @param attemptNumber The number of times client has requested anneal results
    */
    export function GetRequestTimeout(attempt: number) {
        return 1000 * (attempt > 10 ? 60 : 1.5 ** attempt);
    }

    /**
     * Returns partitions data and status
     * @param data Response data received from server
     */
    export function GetCompletedPartitionsData(data: any) {
        const statusMap = data.statusMap as StatusMap;
        let partitions: AnnealStatusResponseState[] = [];
        const expectedNumberOfResults = parseInt(data.expectedNumberOfResults);

        for (let partition in statusMap) {
            if ((statusMap[partition] as AnnealStatusResponseState).status === AnnealStatus.PARTITION_FINISHED) {
                partitions.push(statusMap[partition]);
            }
        }
        const completedPercentage = (partitions.length / expectedNumberOfResults) * 100;
        return {
            isAnnealComplete: partitions.length === expectedNumberOfResults,
            completedPartitions: partitions,
            percentComplete: completedPercentage
        };
    }
}
