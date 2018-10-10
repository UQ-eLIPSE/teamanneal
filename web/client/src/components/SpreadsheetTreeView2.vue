<template>
    <div class="spreadsheet-tree-view">
        <table class="header">
            <SpreadsheetTreeView2Header :padCells="treeMaxDepth"
                                        :headerStyles="filteredHeaderStyles"
                                        :headerRow="filteredHeaderRow"
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
                    <td v-for="i in numberofConstraintColumns"
                        :key="i + numberOfDataColumns"
                        :style="dataColumnStyle(i + numberOfDataColumns - 1)"></td>
                </tr>

                <!-- If we're in the sizing phase, we need to include the header in the contents of the table before we do an analysis of the widths of the columns -->
                <SpreadsheetTreeView2Header ref="sizingPhaseHeader"
                                            class="sizing-phase-header"
                                            :padCells="treeMaxDepth"
                                            :headerRow="filteredHeaderRow"></SpreadsheetTreeView2Header>
            </tbody>

            <!-- Render node roots (partitions or highest stratum) when node roots defined -->
            <template v-if="nodeRoots !== undefined">
                <SpreadsheetTreeView2AnnealNodeRoot v-for="nodeRoot in nodeRoots"
                                                    :isDataPartitioned="nodeRoots.length > 1"
                                                    :key="nodeRoot._id"
                                                    :node="nodeRoot"
                                                    @itemClick="onItemClickHandler"
                                                    :totalNumberOfColumns="totalNumberOfColumns"
                                                    :recordLookupMap="recordLookupMap"
                                                    :nodeNameMap="nodeNameMap"
                                                    :nodeRecordMap="nodeRecordMap"
                                                    :nodeStyles="nodeStyles"
                                                    :collapsedNodes="collapsedNodes"
                                                    :onToggleNodeVisibility="onToggleNodeVisibility"
                                                    :constraintSatisfactionMap="__constraintSatisfactionMap"
                                                    :nodePassingChildrenMapArray="nodePassingChildrenMapArray"></SpreadsheetTreeView2AnnealNodeRoot>
            </template>

            <!-- Render plain table otherwise -->
            <SpreadsheetTreeView2PlainTable v-else
                                            :recordRows="recordRows"></SpreadsheetTreeView2PlainTable>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p, Watch } from "av-ts";
import { ResultsEditor as S } from "../store";
import { Record, RecordElement } from "../../../common/Record";

import { GroupNode } from "../data/GroupNode";
import { GroupNodeRoot } from "../data/GroupNodeRoot";
import { GroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";
import { SatisfactionMap } from "../../../common/ConstraintSatisfaction";

import SpreadsheetTreeView2Header from "./SpreadsheetTreeView2Header.vue";
import SpreadsheetTreeView2AnnealNodeRoot from "./SpreadsheetTreeView2AnnealNodeRoot.vue";
import SpreadsheetTreeView2PlainTable from "./SpreadsheetTreeView2PlainTable.vue";

function getMaxChildrenDepth(node: GroupNode, depth = 0): number {
    switch (node.type) {
        case "root":
        case "intermediate-stratum":
            return node.children.reduce((carry, child) => {
                return Math.max(carry, getMaxChildrenDepth(child, depth + 1));
            }, depth + 1);

        case "leaf-stratum":
            return depth + 1;
    }

    throw new Error("Unknown node type");
}

@Component({
    components: {
        SpreadsheetTreeView2Header,
        SpreadsheetTreeView2AnnealNodeRoot,
        SpreadsheetTreeView2PlainTable,
    },
})
export default class SpreadsheetTreeView2 extends Vue {
    // Props
    @Prop nodeRoots = p<ReadonlyArray<GroupNodeRoot>>({ type: Array, required: false, });
    @Prop headerRow = p<ReadonlyArray<string>>({ type: Array, required: true, });
    @Prop headerStyles = p<ReadonlyArray<{ color?: string, backgroundColor?: string } | undefined>>({ type: Array, required: false, default: () => [] });
    @Prop recordRows = p<ReadonlyArray<Record>>({ type: Array, required: true, });
    @Prop nodeNameMap = p<GroupNodeNameMap>({ required: false, });
    @Prop nodeRecordMap = p<GroupNodeRecordArrayMap>({ required: false, });
    @Prop nodeStyles = p<Map<string | RecordElement, { color?: string, backgroundColor?: string }>>({ required: false });
    @Prop idColumnIndex = p<number>({ type: Number, required: false, default: 0, });
    @Prop constraintSatisfactionMap = p<SatisfactionMap>({ required: false, });
    @Prop showConstraintSatisfaction = p({ type: Boolean, required: false, default: true, });
    @Prop columnsDisplayIndices = p<number[]>({ required: false, });
    @Prop collapsedNodes = p<{ [key: string]: true }>({ required: false, default: () => ({}), });
    @Prop onToggleNodeVisibility = p<(node: GroupNode) => void>({ required: false, default: () => () => { }, });

    // Private
    columnWidths: number[] | undefined = undefined;

    /** Handles item clicks that were delivered from children component */
    onItemClickHandler(data: ({ node: GroupNode } | { recordId: RecordElement })[]) {
        this.$emit("itemClick", data);
    }

    get treeMaxDepth() {
        // Get the maximum depth of all children
        const nodeRoots = this.nodeRoots;

        if (nodeRoots === undefined) {
            return 0;
        }

        return nodeRoots.reduce((carry, node) => {
            return Math.max(carry, getMaxChildrenDepth(node));
        }, 0);
    }

    get numberOfDataColumns() {
        return this.filteredHeaderRow.length;
    }

    get numberofConstraintColumns() {
        return S.state.constraintConfig.constraints.length;
    }

    get filteredHeaderRow() {
        const columnsDisplayIndices = this.columnsDisplayIndices;

        if (columnsDisplayIndices === undefined) {
            return this.headerRow;
        }

        return this.headerRow.filter((_columnLabel, i) => columnsDisplayIndices.indexOf(i) !== -1);
    }

    get filteredHeaderStyles() {
        const columnsDisplayIndices = this.columnsDisplayIndices;

        if (columnsDisplayIndices === undefined) {
            return this.headerStyles;
        }

        return this.headerStyles.filter((_, i) => columnsDisplayIndices.indexOf(i) !== -1);
    }

    get totalNumberOfColumns() {
        return this.numberOfDataColumns + this.treeMaxDepth;
    }

    get recordLookupMap() {
        const idColumnIndex = this.idColumnIndex;
        const columnsDisplayIndices = this.columnsDisplayIndices;

        const filterFunction = columnsDisplayIndices === undefined ? () => true : (_r: RecordElement, i: number) => columnsDisplayIndices.indexOf(i) !== -1;

        return this.recordRows.reduce((map, record) => {
            const id = record[idColumnIndex];
            const filteredRecord = record.filter(filterFunction);
            map.set(id, filteredRecord);
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

    waitAndUpdateColumnWidths() {
        this.columnWidths = undefined;
        Vue.nextTick(() => {
            this.columnWidths = this.sizeColumnWidths();
        });
    }



    orderConstraints(unorderedConstraintIds: string[]): string[] {
        const stateConstraints = S.state.constraintConfig.constraints;
        const orderedConstraintsIds: string[] = [];

        stateConstraints.forEach((constraint) => {
            unorderedConstraintIds.forEach((cId) => {
                if (cId === constraint._id) orderedConstraintsIds.push(cId);
            })
        });

        return orderedConstraintsIds;

    }

    get flatNodeMap() {
        return S.get(S.getter.GET_FLAT_NODE_MAP);
    }

    get nodePassingChildrenMapArray() {
        const passingChildrenMap = this.nestedNodeConstraintPassingMap;

        const nodes = Object.keys(passingChildrenMap);
        if (!nodes || nodes.length === 0) return {};
        const arrayMap: { [nodeId: string]: { constraintId: string, passText: string }[] } = {};


        nodes.forEach(nodeId => {
            const obj = passingChildrenMap[nodeId];
            const objConstraintIds = Object.keys(obj);
            const orderedObjConstraintIds = this.orderConstraints(objConstraintIds);
            if (!arrayMap[nodeId]) arrayMap[nodeId] = [];
            orderedObjConstraintIds.forEach((cId) => {
                const cObj = passingChildrenMap[nodeId][cId];
                if (!cObj) return;
                arrayMap[nodeId].push({ constraintId: cId, passText: (cObj.passing + '/' + cObj.total) });
            });

        });

        return arrayMap;
    }

    get nestedNodeConstraintPassingMap(): { [nodeId: string]: { [constraintId: string]: { passing: number, total: number } } } {
        const passingChildrenMap = S.get(S.getter.GET_PASSING_CHILDREN_MAP) as { [nodeId: string]: { [constraintId: string]: { passing: number, total: number } } };

        const nodes = Object.keys(passingChildrenMap);
        if (!nodes || nodes.length === 0) return {};
        const nestedMap: { [nodeId: string]: { [constraintId: string]: { passing: number, total: number } } } = {};


        nodes.forEach(nodeId => {
            this.buildArrayMap(nodeId, [nodeId], passingChildrenMap, nestedMap)

        });

        return nestedMap;
    }


    buildArrayMap(originalNode: string, nodes: string[], passingChildrenMap: { [nodeId: string]: { [constraintId: string]: { passing: number, total: number } } }, arrayMap: any) {
        nodes.forEach((nodeId) => {
            if (!arrayMap[originalNode]) arrayMap[originalNode] = {};

            const obj = passingChildrenMap[nodeId];
            if (!obj) return;
            const constraintIds = Object.keys(obj);

            constraintIds.forEach((cId) => {
                if (arrayMap[originalNode][cId] === undefined) arrayMap[originalNode][cId] = { passing: 0, total: 0 };
                arrayMap[originalNode][cId].passing += obj[cId].passing;
                arrayMap[originalNode][cId].total += obj[cId].total;
            });


            const node = this.flatNodeMap[nodeId];

            if (node.type !== "leaf-stratum") {
                this.buildArrayMap(originalNode, node.children.map((n) => n._id), passingChildrenMap, arrayMap);
            }
        })

    }


    /** Recalculates width when columns are changed from the column display filter checkboxes */
    @Watch('columnsDisplayIndices')
    columnChangeWidthHandler(_n: any, _o: any) {
        this.waitAndUpdateColumnWidths();
    }

    // Watcher added  to avoid the following error situation: 
    // Error reproduction (before this watcher was implemented):
    // 1. Collapse all partitions
    // 2. Change selected columns from the column checkbox filter
    // 3. Re-open the partition
    // Error: Column widths do not align with the table rows until the checkbox filter is modified again.
    // (Header loses reference to the widths because no table row was rendered)
    @Watch('collapsedNodes')
    strataChangeWidthHandler(_n: any, _o: any) {
        this.waitAndUpdateColumnWidths();
    }

    @Lifecycle mounted() {
        // This is here for non-update situations, where this will temporarily
        // block rendering and hence make it appear aligned upon first load
        this.waitAndUpdateColumnWidths();

        // Widths not updating when the data changes while the view is still
        // open so we need to instead trigger the update late
        //
        // This causes slight momentary unalignment, but otherwise results in
        // the same effect as before
        setTimeout(() => {
            this.waitAndUpdateColumnWidths();
        }, 0);



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
    z-index: 9;
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
