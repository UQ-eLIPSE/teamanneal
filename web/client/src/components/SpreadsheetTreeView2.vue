<template>
    <div id="spreadsheet">
        <table class="header">
            <SpreadsheetTreeView2Header :padCells="treeMaxDepth"
                                        :headerRow="headerRow"></SpreadsheetTreeView2Header>
        </table>
        <table class="contents">
            <!-- One special row to align content in tree layout -->
            <tbody>
                <tr class="alignment-row">
                    <td v-for="n in treeMaxDepth"
                        class="leading-pad-cell"
                        :key="n"></td>
                    <td :colspan="numberOfDataColumns"></td>
                </tr>
            </tbody>

            <SpreadsheetTreeView2AnnealNodeRoot v-for="nodeRoot in annealNodeRoots"
                                                :key="nodeRoot._id"
                                                :node="nodeRoot"
                                                :totalNumberOfColumns="totalNumberOfColumns"
                                                :recordLookupMap="recordLookupMap"></SpreadsheetTreeView2AnnealNodeRoot>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as AnnealNode from "../../../common/AnnealNode";

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
    @Prop idColumnIndex = p<number>({ type: Number, required: true, });

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
        }, new Map<string | number | null, ReadonlyArray<number | string | null>>());
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
#spreadsheet {
    overflow: scroll;
}

.header,
.contents {
    border-collapse: collapse;

    table-layout: fixed;
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
    width: 2em;
    min-width: 2em;
    max-width: 2em;
}
</style>
