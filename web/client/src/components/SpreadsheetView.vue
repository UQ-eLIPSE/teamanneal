<template>
    <div id="spreadsheet">
        <table>
            <tr v-for="(row, i) in rows" :class="{ 'header': i === 0, }">
                <template v-for="(cell, j) in row">
    
                    <!-- Header -->
                    <th v-if="i === 0">
    
                        <!-- When column info is supplied -->
                        <template v-if="!!getColumnInfo(j)">
                            <span class="cell-content">{{ getColumnLabel(j) }}</span>
                            <br>
                            <select class="column-type" :value="getColumnType(j)" @change="emitColumnTypeChange(getColumnInfo(j), $event)">
                                <option>string</option>
                                <option>number</option>
                            </select>
                        </template>
    
                        <!-- When column info is NOT supplied -->
                        <template v-else>
                            <span class="cell-content">{{ cell }}</span>
                        </template>
    
                    </th>
    
                    <!-- Normal cell -->
                    <template v-else>
    
                        <!-- Don't display any content for NaN cells -->
                        <td v-if="Number.isNaN(cell)" class="cell-content nan"></td>
    
                        <!-- Normal cell content -->
                        <td v-else class="cell-content" :class="{ 'null': cell === null, }">{{cell}}</td>
    
                    </template>
    
                </template>
            </tr>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p } from "av-ts";

import * as ColumnInfo from "../data/ColumnInfo";

@Component
export default class SpreadsheetView extends Vue {
    // Props
    @Prop rows: ReadonlyArray<string | number | null> = p(Array) as any;
    @Prop columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo> | undefined = p(Array) as any;
    @Prop stickyHeader = p(Boolean);

    stickyHeader_lastUpdate: number = 0;

    get headerRow() {
        // Returns the first <tr> it encounters, which is the header row
        return this.$el.querySelector("tr");
    }

    getColumnInfo(columnIndex: number) {
        // If there is no information, returned undefined
        if (this.columnInfo === undefined) { return undefined; }

        return this.columnInfo[columnIndex];
    }

    getColumnLabel(columnIndex: number) {
        const columnInfo = this.getColumnInfo(columnIndex);

        // If there is no information, returned undefined
        if (columnInfo === undefined) { return undefined; }

        return columnInfo.label;
    }

    getColumnType(columnIndex: number) {
        const columnInfo = this.getColumnInfo(columnIndex);

        // If there is no information, returned undefined
        if (columnInfo === undefined) { return undefined; }

        return columnInfo.type;
    }

    emitColumnTypeChange(columnInfo: ColumnInfo.ColumnInfo, event: Event) {
        const $el = event.target as HTMLSelectElement;
        const newColumnType: string = $el.value;

        // If no change, then nothing to do
        if (columnInfo.type === newColumnType) { return; }

        // If the column type changed, then pass event up
        this.$emit("columnTypeChange", {
            columnInfo,
            newColumnType,
        });
    }

    @Lifecycle mounted() {
        if (this.stickyHeader) {
            // Enable sticky header on scroll
            this.$el.addEventListener("scroll", () => {
                Vue.nextTick(() => requestAnimationFrame((time: number) => {
                    // If already processed in same frame, don't do again
                    if (this.stickyHeader_lastUpdate === time) { return; }

                    // Translate Y to move header down to compensate for scroll
                    const offset = this.$el.scrollTop;
                    this.headerRow!.style.transform = `translateY(${offset}px)`;

                    // Unmark flag
                    this.stickyHeader_lastUpdate = time;
                }));
            });
        }
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
#spreadsheet {
    overflow: scroll;
}

table {
    border-collapse: collapse;
}

td,
th {
    border: 1px solid #ddd;
    padding: 0.3em 0.5em;
    text-align: inherit;
}

th {
    background: #49075E;
    color: #fff;
    font-weight: 400;
    padding: 0.5em;
}

th select.column-type,
th select.column-type option {
    background: #738;
    color: #fff;
}

th select.column-type {
    border: 1px solid rgba(255, 255, 255, 0.5);
    font-size: 0.7em;
}

.cell-content {
    white-space: pre;
}

.nan {
    background: #fee;
    color: #f00;
}

.nan::before {
    content: "Not a number";
    font-style: italic;
    font-size: 0.7em;
}

.null {
    background: #eef;
    color: #00f;
}

.null::before {
    content: "No value";
    font-style: italic;
    font-size: 0.7em;
}
</style>
