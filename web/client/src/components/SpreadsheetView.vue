<template>
    <div id="spreadsheet">
        <table>
            <thead>
                <tr class="header">
                    <SpreadsheetViewColumnTypeHeader v-for="column in columnData"
                                                     :key="column.index"
                                                     :invalidColumn="!isValidColumn(column)"
                                                     :column="column"></SpreadsheetViewColumnTypeHeader>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, i) in contentRows"
                    :key="i">
                    <td v-for="(cell, j) in row"
                        :key="j"
                        :class="cellClasses(cell, j)">
                        <template v-if="cellContentVisible(cell)">{{ cell }}</template>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { Data as IColumnData } from "../data/ColumnData";

import SpreadsheetViewColumnTypeHeader from "./SpreadsheetViewColumnTypeHeader.vue";

@Component({
    components: {
        SpreadsheetViewColumnTypeHeader,
    },
})
export default class SpreadsheetView extends Vue {
    // Props
    @Prop rows = p<ReadonlyArray<string | number | null>>({ type: Array, required: true, });
    @Prop columnData = p<ReadonlyArray<IColumnData>>({ type: Array, required: true, });
    /**  Array of invalid columns (valid if no duplicate column names exist) */
    @Prop invalidColumns = p<ReadonlyArray<IColumnData>>({ type: Array, required: false, default: () => [] });

    get contentRows() {
        return this.rows.slice(1);
    }

    cellContentVisible(value: any) {
        return !Number.isNaN(value);
    }

    cellClasses(value: any, index: number) {
        const classes = {
            "cell-content": true,
            "nan": Number.isNaN(value),
            "null": value === null,
            "error": !this.isValidColumn(this.columnData[index]),
        }

        return classes;
    }

    /** 
     * Returns if column is valid (i.e. it does not exist in invalid columns 
     * array)
     */
    isValidColumn(column: IColumnData) {
        return this.invalidColumns.indexOf(column) === -1;
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

.error {
    background-color: #ffe2bf;
}
</style>
