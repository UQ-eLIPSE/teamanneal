
import { Store, GetterTree } from "vuex";
import { ResultsEditorState as State } from "./ResultsEditorState";
import { GroupNode } from "../data/GroupNode";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";
import { RecordElement } from "../../../common/Record";

type GetterFunction<G extends ResultsEditorGetter> = typeof getters[G];

export enum ResultsEditorGetter {
    GET_ALL_GROUP_NODES_RECORDS_ARRAY_MAP = "Get map of all nodes to records array"
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
}

function buildNodeToRecordsMap(node: GroupNode, allGroupNodesRecordsMap: any, leafStratumRecordsMap: GroupNodeRecordArrayMap): RecordElement[] {
    if (node.type === "leaf-stratum") {
        allGroupNodesRecordsMap[node._id] = { recordIds: leafStratumRecordsMap[node._id], type: node.type };
        return leafStratumRecordsMap[node._id];
    } else {
        // intermediate stratum
        const nodeRecords = node.children.reduce((records: RecordElement[], child) => {
            const nodeRecordsArray = buildNodeToRecordsMap(child, allGroupNodesRecordsMap, leafStratumRecordsMap);
            return records.concat(nodeRecordsArray);
        }, []);

        allGroupNodesRecordsMap[node._id] = { recordIds: nodeRecords, type: node.type };
        return nodeRecords;
    }
}

export function init() {
    return getters as GetterTree<State, State>;
}