<template>
    <tbody class="wrapper">
        <tr>
            <td class="tree-indicator">
                -
            </td>
            <td v-once
                class="group-heading"
                :colspan="totalNumberOfColumns - depth"
                @click="onHeadingClick">
                <div class="heading-content">
                    <div class="label">{{ label }}</div>
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
                                               :constraintSatisfactionMap="constraintSatisfactionMap"
                                               :onItemClick="onItemClickHandler"></SpreadsheetTreeView2AnnealNodeStratum>
    </tbody>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as AnnealNode from "../../../common/AnnealNode";
import { Record, RecordElement } from "../../../common/Record";

import SpreadsheetTreeView2AnnealNodeStratum from "./SpreadsheetTreeView2AnnealNodeStratum.vue";

@Component({
    components: {
        SpreadsheetTreeView2AnnealNodeStratum,
    }
})
export default class SpreadsheetTreeView2AnnealNodeRoot extends Vue {
    // Props
    @Prop node = p<AnnealNode.NodeRoot>({ required: true, });
    @Prop depth = p({ type: Number, required: false, default: 1, });
    @Prop totalNumberOfColumns = p({ type: Number, required: true, });
    @Prop recordLookupMap = p<Map<RecordElement, Record>>({ required: true, });
    @Prop constraintSatisfactionMap = p<{ [nodeId: string]: number | undefined }>({ required: false, });

    /** Handles click on the heading rendered in this component */
    onHeadingClick() {
        // The node is already appended to the array in the inner handler
        this.onItemClickHandler([]);
    }

    /** Handles item clicks that were delivered from children component */
    onItemClickHandler(data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) {
        this.$emit("itemClick", [{ node: this.node }, ...data]);
    }

    get label() {
        return `AnnealNode.NodeRoot[${this.node._id}]`;
    }

    get innerNodes() {
        return this.node.children;
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
.group-heading {
    border: 1px solid #ddd;
    text-align: inherit;

    background: #738;
    color: #fff;
    font-weight: 400;
    padding: 0.1em 0.5em;
}

.tree-indicator {
    border: 0;
    padding: 0;

    width: 1em;
    min-width: 1em;
    max-width: 1em;

    text-align: right;
}

.heading-content {
    display: flex;
    flex-direction: row;
}

.heading-content .label {
    flex-grow: 1;
    flex-shrink: 1;
}
</style>
