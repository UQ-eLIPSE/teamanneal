<template>
    <div id="spreadsheet">
        <table>
            <thead>
                <tr class="header">
                    <SpreadsheetViewColumnTypeHeader v-for="column in columnInfo"
                                                     :key="column.index"
                                                     :column="column"></SpreadsheetViewColumnTypeHeader>
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

import SpreadsheetViewColumnTypeHeader from "./SpreadsheetViewColumnTypeHeader.vue";

@Component({
    components: {
        SpreadsheetViewColumnTypeHeader,
    }
})
export default class SpreadsheetView extends Vue {
    // Props
    @Prop rows: ReadonlyArray<string | number | null> = p(Array) as any;
    @Prop columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo> = p({ type: Array, required: true, }) as any;

    get contentRows() {
        return this.rows.slice(1);
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

td {
    border: 1px solid #ddd;
    padding: 0.3em 0.5em;
    text-align: inherit;
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
