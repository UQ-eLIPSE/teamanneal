<template>
    <tbody class="anr-wrapper">
        <tr v-if="isDataPartitioned">
            <td class="anr-tree-indicator">
                <button class="toggle-visibility-button"
                        @click.prevent="onToggleNodeVisibility(node)">{{displayInnerNodes?'-':'+'}}</button>
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
        <template v-if="displayInnerNodes">
            <SpreadsheetTreeView2AnnealNodeStratum v-for="node in innerNodes"
                                                   :hiddenNodes="hiddenNodes"
                                                   :key="node._id"
                                                   :node="node"
                                                   :depth="depth + 1"
                                                   :totalNumberOfColumns="totalNumberOfColumns"
                                                   :recordLookupMap="recordLookupMap"
                                                   :nodeNameMap="nodeNameMap"
                                                   :nodeRecordMap="nodeRecordMap"
                                                   :constraintSatisfactionMap="constraintSatisfactionMap"
                                                   :nodeStyles="nodeStyles"
                                                   :onItemClick="onItemClickHandler"
                                                   :onToggleNodeVisibility="onToggleNodeVisibility"></SpreadsheetTreeView2AnnealNodeStratum>
        </template>
    </tbody>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { Record, RecordElement } from "../../../common/Record";
import { SatisfactionMap } from "../../../common/ConstraintSatisfaction";

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
    @Prop nodeStyles = p<Map<string | RecordElement, { color?: string, backgroundColor?: string }>>({ required: false });
    @Prop constraintSatisfactionMap = p< SatisfactionMap | undefined >({ required: false, });
    /** True when anneal results have multiple partitions */
    @Prop isDataPartitioned = p({ type: Boolean, required: true });
    @Prop hiddenNodes = p<{ [key: string]: true }>({ required: true });
    /** Function passed down by parent to toggle a node's visibility */
    @Prop onToggleNodeVisibility = p<(node: GroupNode) => void>({ required: true });


    /** Handles click on the heading rendered in this component */
    onHeadingClick() {
        // The node is already appended to the array in the inner handler
        this.onItemClickHandler([]);
    }

    /** Handles item clicks that were delivered from children component */
    onItemClickHandler(data: ({ node: GroupNode } | { recordId: RecordElement })[]) {
        this.$emit("itemClick", [{ node: this.node }, ...data]);
    }

    /** Check if node id exists as a key in `hiddenNodes` */
    get displayInnerNodes() {
        return this.hiddenNodes[this.node._id] === undefined;
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

.anr-tree-indicator {
    cursor: pointer;
}

.toggle-visibility-button {
    border: 0.1em solid rgba(100, 80, 80, 0.5);
    color: #3c3c3c;
    background: rgba(119, 129, 139, 0.25);
    cursor: pointer;
    border-radius: 0.1rem;
    width: 1rem;
    height: 1rem;
    padding: 0;
    text-align: center;
    font-size: 0.7em;
}

.toggle-visibility-button:hover,
.toggle-visibility-button:active,
.toggle-visibility-button:focus {
    background: rgba(119, 129, 139, 0.1);
}
</style>
