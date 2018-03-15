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
                {{ label }}
            </td>
        </tr>
        <SpreadsheetTreeView2AnnealNodeStratum v-for="node in innerNodes"
                                               :key="node._id"
                                               :node="node"
                                               :depth="depth + 1"
                                               :totalNumberOfColumns="totalNumberOfColumns"
                                               :recordLookupMap="recordLookupMap"
                                               :onItemClick="onItemClickHandler"></SpreadsheetTreeView2AnnealNodeStratum>
    </tbody>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { RecordElement } from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";

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
    @Prop recordLookupMap = p<Map<string | number | null, ReadonlyArray<number | string | null>>>({ required: true, });

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

    width: 2em;
    min-width: 2em;
    max-width: 2em;

    text-align: right;
}
</style>
