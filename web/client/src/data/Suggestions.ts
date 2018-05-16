import { ResultsEditor as S } from "../store";
import { GroupNode } from "../data/GroupNode";

export namespace Suggestions {


    export function getAncestors(nodeId: string) {
        const nodeMap = childToParentNodeMap();
        const parentageArray = [];
        let childId: string | null = nodeId;
        do {
            parentageArray.push(childId);
            childId = nodeMap[childId];
        } while (childId !== null);

        const nodeNameMap = S.state.groupNode.nameMap;
        const names = parentageArray.map((nodeId: string) => nodeNameMap[nodeId]);
        return names.reverse();
    }

    export function getParentage(childToParentNodeMap: { [nodeId: string]: string | null }, node: GroupNode) {
        if (node.type === "root") {
            childToParentNodeMap[node._id] = null;
        }

        if (node.type === "intermediate-stratum" || node.type === "root") {
            node.children.forEach((child) => {
                childToParentNodeMap[child._id] = node._id;
                getParentage(childToParentNodeMap, child);
            });
        }
    }

    export function childToParentNodeMap() {
        const nodeRoots = S.state.groupNode.structure.roots;
        const childToParentNodeMap: { [nodeId: string]: string | null } = {};
        nodeRoots.forEach((root) => getParentage(childToParentNodeMap, root))
        return childToParentNodeMap;
    }



}
