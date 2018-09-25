<template>
    <div class="displayFilterBody">
        <h1>Display Level</h1>
        <select v-model="selectedDepth">
            <option v-for="(s, i) in strataLevels" :key="i" :value="i">{{s}}</option>
        </select>
    </div>
</template>
<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Watch, Lifecycle } from "av-ts";
import { ResultsEditor as S } from "../store";
import { GroupNodeRoot } from "../data/GroupNodeRoot";
import { GroupNodeIntermediateStratum } from "../data/GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "../data/GroupNodeLeafStratum";

@Component
export default class SpreadsheetDisplayFilter extends Vue {

    MEMBER_LEVEL = "Member (individual) level";

    get selectedDepth() {
        return S.state.requestDepth;
    }

    set selectedDepth(value: number) {
        S.dispatch(S.action.SET_DISPLAY_DEPTH, value);
    }

    // Gets the levels that users can choose to display
    get strataLevels() {
        const levels: string[] = [];
        const strata = S.state.strataConfig.strata;

        // Get the partition if applicable
        if (S.get(S.getter.IS_DATA_PARTITIONED)) {
            levels.push(S.state.recordData.partitionColumn!.label);
        }

        for(let i = 0; i < strata.length; i++) {
            levels.push(strata[i].label);
        }

        // Final push would be the default/lower case of members
        levels.push(this.MEMBER_LEVEL);

        return levels;
    }

    get nodeRoots() {
        return S.state.groupNode.structure.roots;
    }

    get collapsedNodes() {
        return S.state.collapsedNodes;
    }

    // If targetdepth <= depth, add it to the list
    recursePathDepth(incomingNode: GroupNodeRoot | GroupNodeIntermediateStratum | GroupNodeLeafStratum, targetDepth: number, depth: number, output: string[]) {

        if ((incomingNode.type === "root") || (incomingNode.type === "intermediate-stratum")) {
            for(let i = 0 ; i < incomingNode.children.length; i++) {
                this.recursePathDepth(incomingNode.children[i], targetDepth, depth + 1, output);
            }
        }

        // Push and grab the children too
        if(S.get(S.getter.IS_DATA_PARTITIONED)) {
            if (targetDepth <= depth) {
                output.push(incomingNode._id);
            }
        } else {
            // Issue is we need to check if we have an actual root or not in terms of pushing
            if (targetDepth < depth) {
                output.push(incomingNode._id);
            }
        }


        return output;
    }
    
    collapseOnDepth(value: number) {
        // Traverse through the path and delete all the nodes necessary
        S.dispatch(S.action.UNCOLLAPSE_NODES, Object.keys(this.collapsedNodes));


        let output: string[] = [];
        const TOP_LEVEL = 0;

        for (let i = 0; i < this.nodeRoots.length; i++) {
            let tempOutput = this.recursePathDepth(this.nodeRoots[i], value, TOP_LEVEL, []);
            output = output.concat(tempOutput);
        }

        // Now hide
        S.dispatch(S.action.COLLAPSE_NODES, output);

    }
    

    get requestDepth(): number {
        return S.get(S.getter.GET_THE_REQUEST_DEPTH);
    }

    @Watch("requestDepth")
    collapseOnChange(value: number, _oldValue: number) {
        this.collapseOnDepth(value);
    }

    
    @Lifecycle mounted() {
        // Setting the initial depth as one level "above" member
        const initialDepth = this.strataLevels.findIndex((level) => level === this.MEMBER_LEVEL) - 1;
        this.selectedDepth = initialDepth;
    }

}
</script>

<!-- ####################################################################### -->

<style scoped>
.filterBody {

}
</style>
