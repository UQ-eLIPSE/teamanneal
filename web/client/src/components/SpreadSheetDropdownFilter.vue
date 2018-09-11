<template>
    <div class="filterBody">
        <h1>Jump to...</h1>
        <select>
            <option v-for="(n, i) in selectionGroup" :key="i">{{n.label}}</option>
        </select>
        <h1>Display Level</h1>
        <select>
            <option v-for="(s, i) in strataLevels" :key="i">{{s}}</option>
        </select>
    </div>
</template>
<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
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

@Component
export default class SpreadSheetDropdownFilter extends Vue {
    // Props
    @Prop nodeRoots = p<ReadonlyArray<GroupNodeRoot>>({ type: Array, required: false, });
    @Prop nodeNameMap = p<GroupNodeNameMap>({ required: false, });
    @Prop nodeRecordMap = p<GroupNodeRecordArrayMap>({ required: false, });

    MEMBER_LEVEL = "Member (individual) level";

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

    get selectionGroup() {
        const strataStructure = S.state.groupNode.structure.roots;
        const output: NodeLabel[] = [];
        for(let i = 0; i <  strataStructure.length; i++) {
            output.concat(this.loopLevel(strataStructure[i], output, 1));
        }

        return output;

    }

    // Recurses through the structure and slowly adds them in the list
    loopLevel(incomingNode: GroupNodeRoot | GroupNodeIntermediateStratum | GroupNodeLeafStratum, output: NodeLabel[], depth: number) {

        const testLabel: NodeLabel = {
            nodeId: incomingNode._id,
            label: S.state.groupNode.nameMap[incomingNode._id]
        }

        output.push(testLabel);

        if ((incomingNode.type == "root") || (incomingNode.type == "intermediate-stratum")) {
            // Treat as root level
            for(let i = 0; i < incomingNode.children.length; i++) {
                this.loopLevel(incomingNode.children[i], output, depth + 1);   
            }
        }

        return output;
    }

}
</script>

<!-- ####################################################################### -->

<style scoped>
.filterBody {

}
</style>
