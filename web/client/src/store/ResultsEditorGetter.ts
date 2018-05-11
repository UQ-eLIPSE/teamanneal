
import { Store, GetterTree } from "vuex";
import { ResultsEditorState as State } from "./ResultsEditorState";
import { GroupNode } from "../data/GroupNode";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";
import { RecordElement } from "../../../common/Record";

type GetterFunction<G extends ResultsEditorGetter> = typeof getters[G];

export enum ResultsEditorGetter {
    GET_ALL_GROUP_NODES_RECORDS_ARRAY_MAP = "Get map of all nodes to records array",
    GET_PARTITION_NODE_MAP = "Get map of partitions to nodes"
}

const G = ResultsEditorGetter;

/** Type-safe getter function factory */
export function getFactory<T>(store: Store<T>, modulePrefix?: string) {
    const prefix = (modulePrefix !== undefined) ? `${modulePrefix}/` : "";

    return function get<G extends ResultsEditorGetter, F extends GetterFunction<G>>(getter: G): ReturnType<F> {
        return store.getters[prefix + getter] as ReturnType<F>;
    }
}

/** Store getter functions */
const getters = {

    [G.GET_ALL_GROUP_NODES_RECORDS_ARRAY_MAP](state: State) {
        const groupNodesToRecordsMap: GroupNodeRecordArrayMap = {};
        const intermediateStratumNodesToRecordsMap: GroupNodeRecordArrayMap = state.groupNode.nodeRecordArrayMap;
        const nodeRoots = state.groupNode.structure.roots;
        nodeRoots.forEach((root) => {
                buildNodeToRecordsMap(root, groupNodesToRecordsMap, intermediateStratumNodesToRecordsMap);
        });

        return groupNodesToRecordsMap;
    },
    [G.GET_PARTITION_NODE_MAP](state: State): { [nodeId: string]: string[] } {
        const partitionToNodeMap: { [nodeId: string]: string[] } = {};
        const nodeRoots = state.groupNode.structure.roots;
        nodeRoots.forEach((root) => {
            partitionToNodeMap[root._id] = [];
            root.children.forEach((child) => getAllChildNodes(child, partitionToNodeMap[root._id]))
        });
        return partitionToNodeMap;
    }
}

function getAllChildNodes(node: GroupNode, nodeArray: string[]) {
    nodeArray.push(node._id);

    if (node.type === "intermediate-stratum") {
        node.children.forEach((child) => getAllChildNodes(child, nodeArray));
    }
}

function buildNodeToRecordsMap(node: GroupNode, groupNodesToRecordsMap: GroupNodeRecordArrayMap, intermediateStratumNodesToRecordsMap: GroupNodeRecordArrayMap): RecordElement[] {
    switch(node.type) {
        case "leaf-stratum": {
            return groupNodesToRecordsMap[node._id] = intermediateStratumNodesToRecordsMap[node._id];
        }

        case "root":
        case "intermediate-stratum": {
            groupNodesToRecordsMap[node._id] = node.children.reduce<RecordElement[]>((accumulatedRecords, child) => {
                return accumulatedRecords.concat(buildNodeToRecordsMap(child, groupNodesToRecordsMap, intermediateStratumNodesToRecordsMap));
            }, []);

            return groupNodesToRecordsMap[node._id];
        }

        default: {
            throw new Error("Invalid node type");
        }

    }
}

export function init() {
    return getters as GetterTree<State, State>;
}