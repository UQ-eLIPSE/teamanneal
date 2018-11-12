<template>
    <tbody class="anr-wrapper">
        <tr>
            <td class="anr-tree-indicator">
                <button class="toggle-visibility-button"
                        @click.prevent="onToggleNodeVisibility(node)">{{displayInnerNodes?'-':'+'}}</button>
            </td>
            <td class="anr-group-heading"
                :colspan="totalNumberOfColumns - depth"
                @click="onHeadingClick">
                <div class="anr-heading-content">
                    <div class="anr-label"
                         :id="node._id">{{ label }}</div>
                    <!-- Node roots/partitions do not have constraints and thus no satisfaction values -->
                </div>
            </td>

            <td class="strata-satisfaction"
                v-for="(numPassingConstraintChild, i) in passingChildrenArray"
                :key="i"
                :class="passClasses(numPassingConstraintChild)"
                @mouseover="enableHover(numPassingConstraintChild.constraintId)"
                @mouseout="disableHover()">
                {{numPassingConstraintChild.passText}}
            </td>
        </tr>
        <template v-if="displayInnerNodes">
            <SpreadsheetTreeView2AnnealNodeStratum v-for="node in innerNodes"
                                                   :collapsedNodes="collapsedNodes"
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
                                                   :onToggleNodeVisibility="onToggleNodeVisibility"
                                                   :onStratumHover="enableHover"
                                                   :offStratumHover="disableHover"
                                                   :nodePassingChildrenMapArray="nodePassingChildrenMapArray"></SpreadsheetTreeView2AnnealNodeStratum>
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
import { ResultsEditor as S } from "../store";
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
    @Prop constraintSatisfactionMap = p<SatisfactionMap | undefined>({ required: false, });
    /** True when anneal results have multiple partitions */
    @Prop isDataPartitioned = p({ type: Boolean, required: true });
    @Prop collapsedNodes = p<{ [key: string]: true }>({ required: true });
    /** Function passed down by parent to toggle a node's visibility */
    @Prop onToggleNodeVisibility = p<(node: GroupNode) => void>({ required: true });
    @Prop nodePassingChildrenMapArray = p<{ [nodeId: string]: { constraintId: string, passText: string }[] }>({ required: false, default: () => Object.create(Object.prototype) });

    /** Handles click on the heading rendered in this component */
    onHeadingClick() {
        // The node is already appended to the array in the inner handler
        this.onItemClickHandler([]);
    }

    /** Handles the hovering constraint of the table ID. Also passed to the stratums */
    enableHover(constraintID: string | undefined) {
        if (constraintID) {
            this.$emit("on-node-hover", constraintID);
        } else {
            // There shouldn't be empty string IDs
            this.$emit("on-node-hover", "");
        }
    }

    /** Handles the moving off of the constraint ID */
    disableHover() {
        this.$emit("off-node-hover");
    }

    /** Handles item clicks that were delivered from children component */
    onItemClickHandler(data: ({ node: GroupNode } | { recordId: RecordElement })[]) {
        this.$emit("itemClick", [{ node: this.node }, ...data]);
    }

    /** Check if node id exists as a key in `collapsedNodes` */
    get displayInnerNodes() {
        return this.collapsedNodes[this.node._id] === undefined;
    }

    get strata() {
        return S.state.strataConfig.strata;
    }
    get label() {
        if (this.nodeNameMap === undefined) {
            return this.node._id;
        }

        const name = this.nodeNameMap[this.node._id];

        // If the node type is root, and data is not partitioned i.e. node name is "undefined"
        if(this.node.type === "root" && (!S.get(S.getter.IS_DATA_PARTITIONED) || name === "undefined" || !name)) {
            return this.strata[0].label + 's';
        } else if(!name) {
            return this.node._id
        }

        return name;
    }

    get innerNodes() {
        return this.node.children;
    }

    get passingChildrenArray() {
        return this.nodePassingChildrenMapArray[this.node._id] || [];
    }

    passClasses(x: {constraintId: string, passText: string}) {
        const classes: string[] = [];
        if (!x || !x.passText) return classes;
        const parts = x.passText.split('/');
        const passing = parseInt(parts[0]);
        const total = parseInt(parts[1]);
        if (passing === 0 && total !== 0) {
            // All failed, red
            classes.push("pass-fail")
        } else if (passing === total) {
            // All passed, green
            classes.push("pass-success");
        } else {
            // Passing not equal to total, yellow
            classes.push("pass-avg");
        }

        return classes;
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
    white-space: nowrap;
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




/* Styles for number of passing nodes cells */

.strata-satisfaction {
    border: 1px solid transparent;
    opacity: 0.7;
    z-index: 8;
    text-align: center;
    padding: 0.5rem;
}

.pass-success {
    color: white;
    background-color: green;
    border-color: #c3e6cb;
}

.pass-fail {
    background-color: rgb(156, 0, 6);
    color: rgb(255, 199, 206);
    border-color: #f5c6cb;
}

.pass-avg { 
    background-color: #d39e00;
    color: white;
    border-color: #c69500;   
}

.strata-satisfaction:hover,
.strata-satisfaction:focus,
.strata-satisfaction:active {
    opacity: 1;
}
</style>
