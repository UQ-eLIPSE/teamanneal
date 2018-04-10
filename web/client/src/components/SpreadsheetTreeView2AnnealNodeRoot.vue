<template>
    <tbody class="anr-wrapper">
        <tr v-if="isDataPartitioned">
            <td class="anr-tree-indicator">
                <button class="collapse-row-button"
                        @click.prevent="toggleNodeRootVisibility">{{displayNodes?'-':'+'}}</button>
            </td>
            <td class="anr-group-heading"
                :colspan="totalNumberOfColumns - depth"
                @click="onHeadingClick">
                <div class="anr-heading-content">
                    <div class="anr-label">{{ label }}</div>
                    <!-- Node roots/partitions do not have constraints and thus no satisfaction values -->
                </div>
            </td>
        </tr>
        <template v-if="displayNodes">
            <SpreadsheetTreeView2AnnealNodeStratum v-for="node in innerNodes"
                                                   :hiddenStrata="hiddenStrata"
                                                   :key="node._id"
                                                   :node="node"
                                                   :depth="depth + 1"
                                                   :totalNumberOfColumns="totalNumberOfColumns"
                                                   :recordLookupMap="recordLookupMap"
                                                   :nodeNameMap="nodeNameMap"
                                                   :constraintSatisfactionMap="constraintSatisfactionMap"
                                                   :nodeStyles="nodeStyles"
                                                   :onItemClick="onItemClickHandler"
                                                   :onItemHide="toggleStratumVisibility"></SpreadsheetTreeView2AnnealNodeStratum>
        </template>
    </tbody>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as AnnealNode from "../../../common/AnnealNode";
import { Record, RecordElement } from "../../../common/Record";

import { NodeNameMapNameGenerated } from "../data/ResultTree";

import SpreadsheetTreeView2AnnealNodeStratum from "./SpreadsheetTreeView2AnnealNodeStratum.vue";

interface HiddenNodes {
    Records: HiddenNodesWithRecordChildren,
    Strata: HiddenNodesWithStratumChildren
}

interface HiddenNodesWithRecordChildren {
    [key: string]: RecordElement[]
}

interface HiddenNodesWithStratumChildren {
    [key: string]: AnnealNode.NodeStratumWithStratumChildren
}



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
    @Prop nodeNameMap = p<NodeNameMapNameGenerated>({ required: false, });
    @Prop nodeStyles = p<Map<AnnealNode.Node | RecordElement, { color?: string, backgroundColor?: string }>>({ required: false });
    @Prop constraintSatisfactionMap = p<{ [nodeId: string]: number | undefined }>({ required: false, });
    /** True when anneal results have multiple partitions */
    @Prop isDataPartitioned = p({ type: Boolean, required: true });

    hiddenStrata: HiddenNodes = { Strata: {}, Records: {} };
    // Private
    displayInnerNodes: boolean = true;

    /** Handles click on the heading rendered in this component */
    onHeadingClick() {
        // The node is already appended to the array in the inner handler
        this.onItemClickHandler([]);
    }

    /** Handles item clicks that were delivered from children component */
    onItemClickHandler(data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) {
        this.$emit("itemClick", [{ node: this.node }, ...data]);
    }

    toggleStratumVisibility(node: AnnealNode.Node) {
        console.log('Toggle');
        console.log(node);
        if (node.type === "stratum-stratum") {
            node.children.forEach((child) => {
                if (this.hiddenStrata.Strata[child._id] === undefined) {
                    Vue.set(this.hiddenStrata.Strata, child._id, child);
                } else {
                    Vue.delete(this.hiddenStrata.Strata, child._id);
                }
            });
        } else if (node.type === "stratum-records") {
            // Vue.set(this.hiddenStrata.Records, node._id, node.recordIds);
            node.recordIds.forEach((recordId) => {
                if (this.hiddenStrata.Records[recordId+''] === undefined) {
                    Vue.set(this.hiddenStrata.Records, recordId + '', recordId);
                } else {
                    Vue.delete(this.hiddenStrata.Records, (recordId + ''));
                }
            });

        }
    }

    toggleNodeRootVisibility() {
        this.displayNodes = !this.displayNodes;
        // Emit event so that parent can recalculate widths
        this.$emit("toggledStratumVisibility");
    }

    get displayNodes() {
        return this.displayInnerNodes;
    }

    set displayNodes(display: boolean) {
        this.displayInnerNodes = display;
    }
    get label() {
        if (this.nodeNameMap === undefined) {
            return this.node._id;
        }

        const name = this.nodeNameMap.get(this.node);

        if (name === undefined) {
            return this.node._id;
        }

        return `${name.stratumLabel} ${name.nodeGeneratedName}`;
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

.anr-tree-indicator .collapse-row-button {
    cursor: pointer;
}
</style>
