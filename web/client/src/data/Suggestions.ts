import { ResultsEditor as S } from "../store";
import { GroupNode } from "../data/GroupNode";

export namespace Suggestions {
    export function getCurrentParent(childToParentNodeMap: any, nodeId: string, parents: string[]): string[] {

        if(nodeId === null || nodeId === undefined) {
            return parents;
        } else {
            parents.push(nodeId);
            return getCurrentParent(childToParentNodeMap, childToParentNodeMap[nodeId], parents) || [];
        }        
    }
    export function getAncestors(nodeId: string) {
        const lineage = getCurrentParent(childToParentNodeMap(), nodeId, []);
        const nodeNameMap = S.state.groupNode.nameMap;
        const names = lineage.filter((nodeId: string) => nodeNameMap[nodeId] !== undefined && nodeNameMap[nodeId] !== null);
        const nodeNames = names.map((nodeId: string) => nodeNameMap[nodeId]);
        
        return nodeNames.reverse();
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
        
        if(nodeRoots.length === 1) {
            // If data was not partitioned i.e. only a single partition
            nodeRoots[0].children.forEach((child) => getParentage(childToParentNodeMap, child));
        } else {
            // Partitioned data. Cycle through all partitions
            nodeRoots.forEach((root) => getParentage(childToParentNodeMap, root))
        }

        return childToParentNodeMap;
    }

}
