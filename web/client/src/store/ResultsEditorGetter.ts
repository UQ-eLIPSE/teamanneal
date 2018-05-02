
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
        const allGroupNodesRecordsMap: any = {};
        const nodeRoots = state.groupNode.structure.roots;
        nodeRoots.forEach((root) => {
            root.children.forEach((child) => {
                buildNodeToRecordsMap(child, allGroupNodesRecordsMap, state.groupNode.nodeRecordArrayMap);
            });
        });

        return allGroupNodesRecordsMap;
    },
    [G.GET_PARTITION_NODE_MAP](state: State) {
        const partitionToNodeMap: any = {};
        const nodeRoots = state.groupNode.structure.roots;
        nodeRoots.forEach((root) => {
            partitionToNodeMap[root._id] = [];
            root.children.forEach((child) => getAllChildNodes(child, partitionToNodeMap[root._id]))
        });
        return partitionToNodeMap;
    }
}

function getAllChildNodes(node: GroupNode, nodeArray: any[]) {
    nodeArray.push(node._id);

    if (node.type === "intermediate-stratum") {
        node.children.forEach((child) => getAllChildNodes(child, nodeArray));
    }
}
function buildNodeToRecordsMap(node: GroupNode, allGroupNodesRecordsMap: GroupNodeRecordArrayMap, leafStratumRecordsMap: GroupNodeRecordArrayMap): RecordElement[] {

    if (node.type === "leaf-stratum") {
        allGroupNodesRecordsMap[node._id] = leafStratumRecordsMap[node._id];
        return leafStratumRecordsMap[node._id];
    }

    // intermediate stratum
    const nodeRecords = node.children.reduce((records: RecordElement[], child) => {
        const nodeRecordsArray = buildNodeToRecordsMap(child, allGroupNodesRecordsMap, leafStratumRecordsMap);
        return records.concat(nodeRecordsArray);
    }, []);

    allGroupNodesRecordsMap[node._id] = nodeRecords;
    return nodeRecords;

}

export function init() {
    return getters as GetterTree<State, State>;
}