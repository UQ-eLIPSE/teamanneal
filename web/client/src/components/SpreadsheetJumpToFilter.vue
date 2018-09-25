<template>
    <div class="SpreadsheetJumpToFilter">
        <h1>Jump to...</h1>
        <select v-model="selectedId">
            <option v-for="(n, i) in selectionGroup" :key="i" :value="n.nodeId">{{n.label}}</option>
        </select>
    </div>
</template>
<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Watch } from "av-ts";
import { GroupNodeRoot } from "../data/GroupNodeRoot";
import { GroupNodeIntermediateStratum } from "../data/GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "../data/GroupNodeLeafStratum";

import { ResultsEditor as S } from "../store";

interface NodeLabel {
    nodeId: string,
    label: string,
}

const DEFAULT_ID = "";

@Component
export default class SpreadsheetJumpToFilter extends Vue {

    // Empty should reference a null/noid
    selectedId: string = DEFAULT_ID;

    // The reason we can't use the structure directly as it orders higher level components last
    // so the ordering cannot be determined
    get selectionGroup() {
        const strataStructure = S.state.groupNode.structure.roots;
        const output: NodeLabel[] = [];

        for(let i = 0; i <  strataStructure.length; i++) {
            this.loopLevel(strataStructure[i], output, 0);
        }

        return output;

    }

    // Recurses through the structure and slowly adds them in the list
    loopLevel(incomingNode: GroupNodeRoot | GroupNodeIntermediateStratum | GroupNodeLeafStratum, output: NodeLabel[], depth: number) {
        const testLabel: NodeLabel = {
            nodeId: incomingNode._id,
            label: "----".repeat(depth) + S.state.groupNode.nameMap[incomingNode._id]
        }
        // Unfortunately the only way to get rid of the undefined is to either not show on a group 
        // level or to not equal " undefined"
        // TODO check this out
        if (testLabel.label !== " undefined") {
            output.push(testLabel);
        }

        if ((incomingNode.type === "root") || (incomingNode.type === "intermediate-stratum")) {
            // Treat as root level
            for(let i = 0; i < incomingNode.children.length; i++) {
                this.loopLevel(incomingNode.children[i], output, depth + 1);   
            }
        }

        return output;
    }

    // Change the collapse
    @Watch("selectedId")
    onSelectIdChange(value: string, _oldValue: string) {
        // Collapse everything except that id
        S.dispatch(S.action.SET_JUMP_REQUEST_ID, value);
    }


}
</script>

<!-- ####################################################################### -->

<style scoped>
.filterBody {

}
</style>
