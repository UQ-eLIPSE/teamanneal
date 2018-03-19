<template>
    <div class="spreadsheet-tree-view">
        <table class="header">
            <SpreadsheetTreeView2Header :padCells="treeMaxDepth"
                                        :headerRow="headerRow"
                                        :columnWidths="columnWidths"></SpreadsheetTreeView2Header>
        </table>
        <table class="contents">
            <tbody>
                <!-- One special row to align content in tree layout -->
                <tr class="alignment-row">
                    <td v-once
                        v-for="n in treeMaxDepth"
                        class="leading-pad-cell"
                        :key="n"></td>
                    <td v-for="i in numberOfDataColumns"
                        :key="i"
                        :style="dataColumnStyle(i-1)"></td>
                </tr>

                <!-- If we're in the sizing phase, we need to include the header in the contents of the table before we do an analysis of the widths of the columns -->
                <SpreadsheetTreeView2Header ref="sizingPhaseHeader"
                                            class="sizing-phase-header"
                                            :padCells="treeMaxDepth"
                                            :headerRow="headerRow"></SpreadsheetTreeView2Header>
            </tbody>

            <!-- Render node roots (partitions or highest stratum) -->
            <SpreadsheetTreeView2AnnealNodeRoot v-for="nodeRoot in annealNodeRoots"
                                                :key="nodeRoot._id"
                                                :node="nodeRoot"
                                                @itemClick="onItemClickHandler"
                                                :totalNumberOfColumns="totalNumberOfColumns"
                                                :recordLookupMap="recordLookupMap"
                                                :nodeNameMap="nodeNameMap"
                                                :constraintSatisfactionMap="__constraintSatisfactionMap"></SpreadsheetTreeView2AnnealNodeRoot>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p } from "av-ts";

import * as AnnealNode from "../../../common/AnnealNode";
import { Record, RecordElement } from "../../../common/Record";

import { NodeNameMapNameGenerated } from "../data/ResultTree";

import SpreadsheetTreeView2Header from "./SpreadsheetTreeView2Header.vue";
import SpreadsheetTreeView2AnnealNodeRoot from "./SpreadsheetTreeView2AnnealNodeRoot.vue";

function getMaxChildrenDepth(node: AnnealNode.Node, depth = 0): number {
    switch (node.type) {
        case "root":
        case "stratum-stratum":
            return node.children.reduce((carry, child) => {
                return Math.max(carry, getMaxChildrenDepth(child, depth + 1));
            }, depth + 1);

        case "stratum-records":
            return depth + 1;
    }

    throw new Error("Unknown node type");
}

@Component({
    components: {
        SpreadsheetTreeView2Header,
        SpreadsheetTreeView2AnnealNodeRoot,
    },
})
export default class SpreadsheetTreeView2 extends Vue {
    // Props
    @Prop annealNodeRoots = p<ReadonlyArray<AnnealNode.NodeRoot>>({ type: Array, required: true, });
    @Prop headerRow = p<ReadonlyArray<string>>({ type: Array, required: true, });
    @Prop recordRows = p<ReadonlyArray<ReadonlyArray<number | string | null>>>({ type: Array, required: true, });
    @Prop nodeNameMap = p<NodeNameMapNameGenerated>({ required: false, });
    @Prop idColumnIndex = p<number>({ type: Number, required: true, });

    @Prop constraintSatisfactionMap = p<{ [nodeId: string]: number | undefined }>({ required: false, });
    @Prop showConstraintSatisfaction = p({ type: Boolean, required: false, default: true, });

    // Private
    columnWidths: number[] | undefined = undefined;

    /** Handles item clicks that were delivered from children component */
    onItemClickHandler(data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) {
        this.$emit("itemClick", data);
    }

    get treeMaxDepth() {
        // Get the maximum depth of all children
        return this.annealNodeRoots.reduce((carry, node) => {
            return Math.max(carry, getMaxChildrenDepth(node));
        }, 0);
    }

    get numberOfDataColumns() {
        return this.headerRow.length;
    }

    get totalNumberOfColumns() {
        return this.numberOfDataColumns + this.treeMaxDepth;
    }

    get recordLookupMap() {
        const idColumnIndex = this.idColumnIndex;

        return this.recordRows.reduce((map, record) => {
            const id = record[idColumnIndex];
            map.set(id, record);
            return map;
        }, new Map<RecordElement, Record>());
    }

    /**
     * Special gated version of the constraint satisfaction map that is only 
     * returned when conditions are appropriate
     */
    get __constraintSatisfactionMap() {
        if (!this.showConstraintSatisfaction) {
            return undefined;
        }

        return this.constraintSatisfactionMap;
    }

    dataColumnStyle(i: number) {
        // If no width information is available, no style is applied
        if (this.columnWidths === undefined) {
            return undefined;
        }

        // The column widths include pad cell widths too, so we need to
        // offset by the number `treeMaxDepth`
        const cellWidth = `${this.columnWidths[i + this.treeMaxDepth]}px`;

        return {
            width: cellWidth,
            minWidth: cellWidth,
            maxWidth: cellWidth,
        };
    }

    sizeColumnWidths() {
        const headerEl = (this.$refs["sizingPhaseHeader"] as Vue).$el as HTMLTableRowElement;

        // "Show" the element for measurements
        headerEl.classList.add("show");

        // Measure all columns
        const widths: number[] = [];

        for (let i = 0; i < headerEl.children.length; ++i) {
            const headerCell = headerEl.children[i];
            widths.push(headerCell.getBoundingClientRect().width);
        }

        // Hide the element again
        headerEl.classList.remove("show");

        return widths;
    }

    updateColumnWidths() {
        this.columnWidths = this.sizeColumnWidths();
    }

    @Lifecycle mounted() {
        this.updateColumnWidths();
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
.spreadsheet-tree-view {
    overflow: scroll;
}

.header,
.contents {
    border-collapse: collapse;
}

.header {
    position: sticky;
    top: 0;

    /* Overlap borders along bottom over data rows */
    margin-bottom: -1px;

    border: 1px solid #ddd;
}

.alignment-row,
.alignment-row td {
    border: 0;
    margin: 0;
    padding: 0;

    height: 0;
    min-height: 0;
    max-height: 0;

    visibility: hidden;
}

.alignment-row .leading-pad-cell {
    width: 1em;
    min-width: 1em;
    max-width: 1em;
}

.sizing-phase-header {
    display: none;
    visibility: hidden;
}

.sizing-phase-header.show {
    display: table-row;
}
</style>
