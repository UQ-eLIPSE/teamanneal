<template>
    <div class="filterBody">
        <h1>Jump to...</h1>
        <select v-model="selectedId">
            <option v-for="(n, i) in selectionGroup" :key="i" :value="n.nodeId">{{n.label}}</option>
        </select>
        <h1>Display Level</h1>
        <select>
            <option v-for="(s, i) in strataLevels" :key="i">{{s}}</option>
        </select>
    </div>
</template>
<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p, Watch } from "av-ts";
import { GroupNodeRoot } from "../data/GroupNodeRoot";
import { GroupNodeIntermediateStratum } from "../data/GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "../data/GroupNodeLeafStratum";
import { GroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap"

import { ResultsEditor as S } from "../store";

interface NodeLabel {
    nodeId: string,
    label: string,
}

const DEFAULT_LEVEL = -1;
const DEFAULT_ID = "";

@Component
export default class SpreadSheetDropdownFilter extends Vue {
    // Props
    @Prop nodeRoots = p<ReadonlyArray<GroupNodeRoot>>({ type: Array, required: false, });
    @Prop nodeNameMap = p<GroupNodeNameMap>({ required: false, });
    @Prop nodeRecordMap = p<GroupNodeRecordArrayMap>({ required: false, });

    MEMBER_LEVEL = "Member (individual) level";

    // Empty should reference a null/noid
    selectedId: string = DEFAULT_ID;

    // -1 indicates 
    selectedDepth: number = DEFAULT_LEVEL;

    // Gets the levels that users can choose to display
    get strataLevels() {
        const levels: string[] = [];
        const strata = S.state.strataConfig.strata;

        for(let i = 0; i < strata.length; i++) {
            levels.push(strata[i].label);
        }

        // Final push would be the default/lower case of members
        levels.push(this.MEMBER_LEVEL);

        return levels;
    }

    // The reason we can't use the structure directly as it orders higher level components last
    // so the ordering cannot be determined
    get selectionGroup() {
        const strataStructure = S.state.groupNode.structure.roots;
        const output: NodeLabel[] = [];
        for(let i = 0; i <  strataStructure.length; i++) {
            output.concat(this.loopLevel(strataStructure[i], output, 0));
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
    onSelectIdChange(_value: string, _oldValue: string) {
        // Collapse everything except that id
        S.dispatch(S.action.SET_JUMP_REQUEST_ID, _value);
    }

    
    @Watch("selectedDepth")
    onDepthChange(_value: number, _oldValue: number) {
        // Collapse based on depth
        // Actually it is smarter to think of the reverse.
        // E.g. Don't collapse until we reach this level.
        
        // Temporarily do this on the store level
        S.dispatch(S.action.SET_DISPLAY_DEPTH, _value);
    }


}
</script>

<!-- ####################################################################### -->

<style scoped>
.filterBody {

}
</style>
