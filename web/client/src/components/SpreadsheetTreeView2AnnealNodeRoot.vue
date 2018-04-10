<template>
    <tbody class="anr-wrapper">
        <tr>
            <td class="anr-tree-indicator">
                -
            </td>
            <td v-once
                class="anr-group-heading"
                :colspan="totalNumberOfColumns - depth"
                @click="onHeadingClick">
                <div class="anr-heading-content">
                    <div class="anr-label">{{ label }}</div>
                    <!-- Node roots/partitions do not have constraints and thus no satisfaction values -->
                </div>
            </td>
        </tr>
        <SpreadsheetTreeView2AnnealNodeStratum v-for="node in innerNodes"
                                               :key="node._id"
                                               :node="node"
                                               :depth="depth + 1"
                                               :totalNumberOfColumns="totalNumberOfColumns"
                                               :recordLookupMap="recordLookupMap"
                                               :nodeNameMap="nodeNameMap"
                                               :nodeRecordMap="nodeRecordMap"
                                               :constraintSatisfactionMap="constraintSatisfactionMap"
                                               :nodeStyles="nodeStyles"
                                               :onItemClick="onItemClickHandler"></SpreadsheetTreeView2AnnealNodeStratum>
    </tbody>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { Record, RecordElement } from "../../../common/Record";

import { GroupNode } from "../data/GroupNode";
import { GroupNodeRoot } from "../data/GroupNodeRoot";
import { GroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";

import SpreadsheetTreeView2AnnealNodeStratum from "./SpreadsheetTreeView2AnnealNodeStratum.vue";

@Component({
    components: {
        SpreadsheetTreeView2AnnealNodeStratum,
    }
})
export default class SpreadsheetTreeView2AnnealNodeRoot extends Vue {
    // Props
    @Prop node = p<GroupNodeRoot>({ required: true, });
    @Prop depth = p({ type: Number, required: false, default: 1, });
    @Prop totalNumberOfColumns = p({ type: Number, required: true, });
    @Prop recordLookupMap = p<Map<RecordElement, Record>>({ required: true, });
    @Prop nodeNameMap = p<GroupNodeNameMap>({ required: false, });
    @Prop nodeRecordMap = p<GroupNodeRecordArrayMap>({ required: false, });
    @Prop nodeStyles = p<Map<GroupNode | RecordElement, { color?: string, backgroundColor?: string }>>({ required: false });
    @Prop constraintSatisfactionMap = p<{ [nodeId: string]: number | undefined }>({ required: false, });

    /** Handles click on the heading rendered in this component */
    onHeadingClick() {
        // The node is already appended to the array in the inner handler
        this.onItemClickHandler([]);
    }

    /** Handles item clicks that were delivered from children component */
    onItemClickHandler(data: ({ node: GroupNode } | { recordId: RecordElement })[]) {
        this.$emit("itemClick", [{ node: this.node }, ...data]);
    }

    get label() {
        if (this.nodeNameMap === undefined) {
            return this.node._id;
        }

        const name = this.nodeNameMap[this.node._id];

        if (name === undefined) {
            return this.node._id;
        }

        return name;
    }

    get innerNodes() {
        return this.node.children;
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
/**
 * ALL classes must be prefixed with `anr` to prevent leakage of styles into
 * functional child components 
 */

.anr-group-heading {
    border: 1px solid #ddd;
    text-align: inherit;

    background: #738;
    color: #fff;
    font-weight: 400;
    padding: 0.1em 0.5em;
}

.anr-tree-indicator {
    border: 0;
    padding: 0;

    width: 1em;
    min-width: 1em;
    max-width: 1em;

    text-align: right;
}

.anr-heading-content {
    display: flex;
    flex-direction: row;
}

.anr-heading-content .anr-label {
    flex-grow: 1;
    flex-shrink: 1;
}
</style>
