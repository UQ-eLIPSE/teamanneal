<template>
    <div id="spreadsheet">
        <table>
            <thead>
                <tr class="header">
                    <th v-for="column in columnInfo">
                        <template>
                            <span class="cell-content">{{ column.label }}</span>
                            <br>
                            <select class="column-type"
                                    :value="column.type"
                                    @change="emitColumnTypeChange(column, $event)">
                                <option>string</option>
                                <option>number</option>
                            </select>
                        </template>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in contentRows">
                    <template v-for="cell in row">
                        <!-- Don't display any content for NaN cells -->
                        <td v-if="Number.isNaN(cell)"
                            class="cell-content nan"></td>
    
                        <!-- Normal cell content -->
                        <td v-else
                            class="cell-content"
                            :class="{ 'null': cell === null, }">{{cell}}</td>
                    </template>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as ColumnInfo from "../data/ColumnInfo";

@Component
export default class SpreadsheetView extends Vue {
    // Props
    @Prop rows: ReadonlyArray<string | number | null> = p(Array) as any;
    @Prop columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo> = p({ type: Array, required: true, }) as any;

    get contentRows() {
        return this.rows.slice(1);
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
