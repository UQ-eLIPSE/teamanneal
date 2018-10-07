
import { Store, GetterTree } from "vuex";
import { ResultsEditorState as State } from "./state";

import { GroupNode } from "../../data/GroupNode";
import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";
import { GroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";

import * as Record from "../../../../common/Record";
import * as Stratum from "../../../../common/Stratum";
import * as AnnealNode from "../../../../common/AnnealNode";
import * as Constraint from "../../../../common/Constraint";
import * as RecordDataColumn from "../../../../common/RecordDataColumn";

import { reverse } from "../../util/Array";
import { SatisfactionState } from "../../../../common/ConstraintSatisfaction";

type GetterFunction<G extends ResultsEditorGetter> = typeof getters[G];

type Getters = GetterTree<State, State>;

export enum ResultsEditorGetter {
    GET_ALL_GROUP_NODES_RECORDS_ARRAY_MAP = "Get map of all nodes to records array",
    GET_PARTITION_NODE_MAP = "Get map of partitions to nodes",

    GET_FLAT_NODE_ARRAY = "Get a flat array of all nodes",

    GET_NODE_TO_STRATUM_MAP = "Get map of node ID to stratum ID",
    GET_RECORD_COOKED_VALUE_ROW_ARRAY = "Get the record cooked value row array (generated from transposed column data)",
    GET_COMMON_COLUMN_DESCRIPTOR_ARRAY = "Get common column descriptor array (type = `RecordDataColumn.ColumnDesc`)",
    GET_COMMON_STRATA_DESCRIPTOR_ARRAY_IN_SERVER_ORDER = "Get common strata descriptor array in server order ([lowest/leaf, ..., highest])",
    GET_COMMON_CONSTRAINT_DESCRIPTOR_ARRAY = "Get common constraint descriptor array",
    GET_COMMON_ANNEALNODE_ARRAY = "Get common AnnealNode array",
    GET_THE_REQUEST_DEPTH = "Get request ID DEPTH",
    IS_DATA_PARTITIONED = "Check if partitions(pools) were created",
    GET_SATISFACTION = "Get satisfaction data",
    GET_RECORD_LOOKUP_MAP = "Get record lookup map",
    GET_CHILD_TO_PARENT_MAP = "Get child node to parent node map"
}

const G = ResultsEditorGetter;

/** Type-safe getter function factory */
export function getFactory<T>(store: Store<T>, modulePrefix?: string) {
    const prefix = (modulePrefix !== undefined) ? `${modulePrefix}/` : "";

    return function get<G extends ResultsEditorGetter, F extends GetterFunction<G>>(getter: G): ReturnType<F> {
        return store.getters[prefix + getter] as ReturnType<F>;
    }
}

/** Internal get function */
function get<G extends ResultsEditorGetter, F extends GetterFunction<G>>(getters: Getters, getterName: G): ReturnType<F> {
    return getters[getterName] as ReturnType<F>;
}

/** Store getter functions */
const getters = {
    [G.GET_ALL_GROUP_NODES_RECORDS_ARRAY_MAP](state: State) {
        const allGroupNodesRecordsMap: GroupNodeRecordArrayMap = {};
        const nodeRoots = state.groupNode.structure.roots;
        nodeRoots.forEach((root) => {
            root.children.forEach((child) => {
                buildNodeToRecordsMap(child, allGroupNodesRecordsMap, state.groupNode.nodeRecordArrayMap);
            });
        });

        return allGroupNodesRecordsMap;
    },
    [G.GET_PARTITION_NODE_MAP](state: State) {
        const partitionToNodeMap: { [nodeId: string]: string[] } = {};
        const nodeRoots = state.groupNode.structure.roots;
        nodeRoots.forEach((root) => {
            partitionToNodeMap[root._id] = [];
            root.children.forEach((child) => getAllChildNodes(child, partitionToNodeMap[root._id]))
        });
        return partitionToNodeMap;
    },

    [G.GET_FLAT_NODE_ARRAY](state: State) {
        const array: GroupNode[] = [];

        state.groupNode.structure.roots.forEach(function nodeFlattener(node: GroupNode) {
            array.push(node);

            switch (node.type) {
                case "root":
                case "intermediate-stratum": {
                    node.children.forEach(nodeFlattener);
                    break;
                }
            }
        });

        return array;
    },

    [G.GET_NODE_TO_STRATUM_MAP](state: State) {
        // State strata order is [highest, ..., lowest/leaf]
        const stateStrata = state.strataConfig.strata;

        const map: { [nodeId: string]: string } = {};

        // No data
        if (stateStrata.length === 0) {
            return map;
        }

        function writeNodeStratumMap(node: GroupNode, depth: number = 0) {
            switch (node.type) {
                case "root": {
                    // Roots do not appear in strata
                    node.children.forEach(c => writeNodeStratumMap(c, depth));
                    break;
                }

                case "intermediate-stratum": {
                    map[node._id] = stateStrata[depth]._id;
                    node.children.forEach(c => writeNodeStratumMap(c, depth + 1));
                    break;
                }

                case "leaf-stratum": {
                    map[node._id] = stateStrata[depth]._id;
                    break;
                }
            }
        }

        // Begin recursively loading up node stratum map
        state.groupNode.structure.roots.forEach(root => writeNodeStratumMap(root));

        return map;
    },

    [G.GET_RECORD_COOKED_VALUE_ROW_ARRAY](state: State) {
        const stateColumns = state.recordData.source.columns;

        // No data
        if (stateColumns.length === 0) {
            return [];
        }

        return ColumnData.TransposeIntoCookedValueRowArray(stateColumns);
    },

    [G.GET_COMMON_COLUMN_DESCRIPTOR_ARRAY](state: State) {
        const idColumn = state.recordData.idColumn;

        // No data
        if (idColumn === undefined) {
            return [];
        }

        // Keep track of the ID column
        let idColumnIndex: number | undefined = undefined;

        const columns = state.recordData.source.columns.map((column, i) => {
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

        return columns;
    },

    [G.GET_COMMON_STRATA_DESCRIPTOR_ARRAY_IN_SERVER_ORDER](state: State) {
        const stateStrata = state.strataConfig.strata;
        const strataServerOrder = reverse(stateStrata);

        return strataServerOrder.map(({ _id, label, size }) => {
            const stratum: Stratum.Desc = {
                _id,
                label,
                size,
            };

            return stratum;
        });
    },

    [G.GET_COMMON_CONSTRAINT_DESCRIPTOR_ARRAY](state: State) {
        const stateStrata = state.strataConfig.strata;
        const stateColumns = state.recordData.source.columns;

        // No data
        if (stateStrata.length === 0 || stateColumns.length === 0) {
            return [];
        }

        return state.constraintConfig.constraints.map(
            (internalConstraint) => {
                // Check that the stratum referred in the constraint actually 
                // exists
                const stratumId = internalConstraint.stratum;

                if (!stateStrata.some(s => s._id === stratumId)) {
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
    },

    [G.GET_COMMON_ANNEALNODE_ARRAY](state: State, getters: Getters) {
        const nodeToRecordIds = state.groupNode.nodeRecordArrayMap;
        const nodeToStratumIds = get(getters, G.GET_NODE_TO_STRATUM_MAP);

        // Convert GroupNode nodes into AnnealNode nodes
        return state.groupNode.structure.roots.map((root) => {
            const rootNode: AnnealNode.NodeRoot = {
                _id: root._id,
                type: "root",
                partitionValue: "", // TODO: This has yet to be implemented
                children: root.children.map(function _(child) {
                    switch (child.type) {
                        case "intermediate-stratum": {
                            const intermediateNode: AnnealNode.NodeStratumWithStratumChildren = {
                                _id: child._id,
                                type: "stratum-stratum",
                                stratum: nodeToStratumIds[child._id],
                                children: child.children.map(_),
                            }

                            return intermediateNode;
                        }

                        case "leaf-stratum": {
                            const leafNode: AnnealNode.NodeStratumWithRecordChildren = {
                                _id: child._id,
                                type: "stratum-records",
                                stratum: nodeToStratumIds[child._id],
                                recordIds: nodeToRecordIds[child._id],
                            }

                            return leafNode;
                        }
                    }
                }),
            };

            return rootNode;
        });
    },
    [G.GET_THE_REQUEST_DEPTH](state: State) {
        return state.requestDepth;
    },

    [G.IS_DATA_PARTITIONED](state: State) {
        return state.groupNode.structure.roots.length > 1;
    },
    [G.GET_SATISFACTION](state: State): SatisfactionState {
    
        return state.satisfaction;
    },
    /**
     * Copied existing record lookup map functionality from Results editor for now
     */
    [G.GET_RECORD_LOOKUP_MAP](state: State) {

        if (!state.recordData || !state.recordData.source.columns || state.recordData.source.columns.length === 0) return {};

        const recordRows = ColumnData.TransposeIntoCookedValueRowArray(state.recordData.source.columns);
        const idColumnDesc = state.recordData.idColumn;

        if (idColumnDesc === undefined) {
            throw new Error("No ID column set");
        }

        const idColumn = state.recordData.source.columns.find(col => ColumnData.Equals(idColumnDesc, col));

        if (idColumn === undefined) {
            throw new Error("No ID column set");
        }

        const idColumnIndex = state.recordData.source.columns.indexOf(idColumn);

        return recordRows.reduce((map, record) => {
            const id = record[idColumnIndex];
            map.set(id, record);
            return map;
        }, new Map<Record.RecordElement, Record.Record>());

    },
    /** Maps child node id to parent node id. For root nodes, parent is null */
    [G.GET_CHILD_TO_PARENT_MAP](state: State): { [key: string]: (string | null) } {
        const nodeRoots = state.groupNode.structure.roots;
        const childToParentNodeMap: { [nodeId: string]: string | null } = {};

        if (nodeRoots.length === 1) {
            // If data was not partitioned i.e. only a single partition (by default)
            nodeRoots[0].children.forEach((child) => mapChildToParentRecursively(childToParentNodeMap, child));
        } else {
            // Partitioned data. Cycle through all partitions
            nodeRoots.forEach((root) => mapChildToParentRecursively(childToParentNodeMap, root))
        }
        return childToParentNodeMap;
    }
}

function getAllChildNodes(node: GroupNode, nodeArray: any[]) {
    nodeArray.push(node._id);

    if (node.type === "intermediate-stratum") {
        node.children.forEach((child) => getAllChildNodes(child, nodeArray));
    }
}
function buildNodeToRecordsMap(node: GroupNode, allGroupNodesRecordsMap: GroupNodeRecordArrayMap, leafStratumRecordsMap: GroupNodeRecordArrayMap): Record.RecordElement[] {
    if (node.type === "leaf-stratum") {
        allGroupNodesRecordsMap[node._id] = leafStratumRecordsMap[node._id];
        return leafStratumRecordsMap[node._id];
    }

    // intermediate stratum
    const nodeRecords = node.children.reduce((records: Record.RecordElement[], child) => {
        const nodeRecordsArray = buildNodeToRecordsMap(child, allGroupNodesRecordsMap, leafStratumRecordsMap);
        return records.concat(nodeRecordsArray);
    }, []);

    allGroupNodesRecordsMap[node._id] = nodeRecords;

    return nodeRecords;
}

function convertConstraintValue(columnDescriptor: IColumnData_MinimalDescriptor, value: Record.RecordElement) {
    // If the value is a string that falls under a numeric column, then
    // convert it to a number
    if (typeof value === "string" &&
        columnDescriptor.type === "number") {
        return +value;
    }

    return value;
}

export function mapChildToParentRecursively(childToParentNodeMap: { [nodeId: string]: string | null }, node: GroupNode) {
    if (node.type === "root") {
        // Root node has no parent, assign null
        childToParentNodeMap[node._id] = null;
    }

    if (node.type === "intermediate-stratum" || node.type === "root") {
        node.children.forEach((child) => {
            childToParentNodeMap[child._id] = node._id;
            mapChildToParentRecursively(childToParentNodeMap, child);
        });
    }
}

export function init() {
    return getters as Getters;
}
