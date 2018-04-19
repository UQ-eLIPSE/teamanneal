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

import { AnnealCreator as S } from "../store";

import * as Partition from "./Partition";
import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";

export interface AnnealRequest {
    _id: string,
    time: number,

    requestObject: AxiosPromise,
    cancelTokenSource: CancelTokenSource,

    body: ToServerAnnealRequest.Root,
}

function init(requestObject: AxiosPromise, cancelTokenSource: CancelTokenSource, requestBody: ToServerAnnealRequest.Root, time: number = Date.now()) {
    const obj: AnnealRequest = {
        _id: UUID.generate(),
        time,

        requestObject,
        cancelTokenSource,

        body: requestBody,
    };

    return obj;
}

export function generateRequestFromState(state: typeof S.state) {
    // Translate state into request body and create AJAX request
    const body = convertStateToAnnealRequestBody(state);
    const { request, cancelTokenSource } = createAnnealAjaxRequest(body);

    // Create AnnealRequest object
    const annealRequestObject = init(request, cancelTokenSource, body);

    return annealRequestObject;
}

function convertStateToAnnealRequestBody(state: typeof S.state) {
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
    const stateStrata = state.strataConfig.strata;
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
    const statePartitions = Partition.initManyFromPartitionColumnDescriptor(stateColumns, partitionColumnDescriptor);

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

    const stateConstraints = state.constraintConfig.constraints;
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

function createAnnealAjaxRequest(data: any) {
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

export function cancel(annealRequest: AnnealRequest, message?: string) {
    return annealRequest.cancelTokenSource.cancel(message);
}

/**
 * Returns a Promise which is satisfied when the request completes (either 
 * success or error)
 */
export async function waitForCompletion(annealRequest: AnnealRequest) {
    try {
        return (await annealRequest.requestObject) as AxiosResponse;
    } catch (e) {
        return e as AxiosError;
    }
}
