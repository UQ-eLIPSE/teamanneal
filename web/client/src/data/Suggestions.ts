import { ResultsEditor as S } from "../store";

export namespace Suggestions {
    export function getParentsRecursively(childToParentNodeMap: {[key: string]: (string | null | undefined)}, nodeId: string | null | undefined, parents: string[]): string[] {

        if(nodeId === null || nodeId === undefined) {
            return parents;
        } else {
            parents.push(nodeId);
            return getParentsRecursively(childToParentNodeMap, childToParentNodeMap[nodeId], parents) || [];
        }        
    }

    export function getAncestors(nodeId: string) {
        const lineage = getParentsRecursively(S.get(S.getter.GET_CHILD_TO_PARENT_MAP), nodeId, []);
        const nodeNameMap = S.state.groupNode.nameMap;
        const names = lineage.filter((nodeId: string) => nodeNameMap[nodeId] !== undefined && nodeNameMap[nodeId] !== null);
        const nodeNames = names.map((nodeId: string) => nodeNameMap[nodeId]);
        
        return nodeNames.reverse();
    }
}
