
import { ResultsEditorState } from "./ResultsEditorState";
import { GroupNode } from "../data/GroupNode";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";
import { RecordElement } from "../../../common/Record";

function buildNodeToRecordsMap(node: GroupNode, allGroupNodesRecordsMap: any, leafStratumRecordsMap: GroupNodeRecordArrayMap) {
    if (node.type === "leaf-stratum") {
        return leafStratumRecordsMap[node._id];
    } else {
        // intermediate stratum
        const records = node.children.reduce((records: RecordElement[], child) => {
            const nodeRecordsArray = buildNodeToRecordsMap(child, allGroupNodesRecordsMap, leafStratumRecordsMap);
            if (Array.isArray(nodeRecordsArray) && nodeRecordsArray !== undefined) {
                return records.concat(nodeRecordsArray);
            }
            return [];
        }, []);
        allGroupNodesRecordsMap[node._id] = records;
    }
}

/** Store getter functions */
export const getters = {
    getAllNodesRecordsMap: function (state: ResultsEditorState) {
        const allGroupNodesRecordsMap = Object.assign({}, state.groupNode.nodeRecordArrayMap);
        const nodeRoots = state.groupNode.structure.roots;
        nodeRoots.forEach((root) => {
            root.children.forEach((child) => {
                buildNodeToRecordsMap(child, allGroupNodesRecordsMap, state.groupNode.nodeRecordArrayMap);
            });
        });

        return allGroupNodesRecordsMap;
    }
}