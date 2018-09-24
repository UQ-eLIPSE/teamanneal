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

// The default would be the level 1
const DEFAULT_LEVEL = 1;

@Component
export default class SpreadSheetDropdownFilter extends Vue {

    MEMBER_LEVEL = "Member (individual) level";

    // -1 indicates default
    selectedDepth: number = DEFAULT_LEVEL;

    // Has root
    hasRoot: boolean = false;

    // Gets the levels that users can choose to display
    get strataLevels() {
        const levels: string[] = [];
        const strata = S.state.strataConfig.strata;

        // Get the partition if applicable
        if (S.state.recordData.partitionColumn) {
            levels.push(S.state.recordData.partitionColumn.label);
            this.hasRoot = true;
        } else {
            this.hasRoot = false;
        }

        for(let i = 0; i < strata.length; i++) {
            levels.push(strata[i].label);
        }

        // Final push would be the default/lower case of members
        levels.push(this.MEMBER_LEVEL);

        return levels;
    }
    
    @Watch("selectedDepth")
    onDepthChange(value: number, _oldValue: number) {
        // Collapse based on depth
        // Actually it is smarter to think of the reverse.
        // E.g. Don't collapse until we reach this level.
        
        // Temporarily do this on the store level
        S.dispatch(S.action.SET_DISPLAY_DEPTH, value);
    }

    @Watch("hasRoot")
    onRootChange(value: boolean, _oldValue:boolean) {
        S.dispatch(S.action.SET_HAS_ROOT, value);
    }

    @Lifecycle mounted() {
        // Dispatch the default level. If we have 2 items we want to hide the 0
        let length = this.strataLevels.length - 2;
        S.dispatch(S.action.SET_DISPLAY_DEPTH, length);

        // Also give the root
        if (S.state.recordData.partitionColumn) {
            S.dispatch(S.action.SET_HAS_ROOT, true);
        } else {
            S.dispatch(S.action.SET_HAS_ROOT, false);
        }

    }


}
</script>

<!-- ####################################################################### -->

<style scoped>
.filterBody {

}
</style>
