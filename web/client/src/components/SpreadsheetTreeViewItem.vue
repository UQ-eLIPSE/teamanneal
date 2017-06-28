<template>
    <tr v-if="isItemGroupHeading">
        <td v-once
            :colspan="numberOfColumns">{{ item }}</td>
    </tr>
    <tr v-else>
        <template v-for="cell in item">
            <!-- Don't display any content for NaN cells -->
            <td v-if="Number.isNaN(cell)"
                class="cell-content nan"></td>
    
            <!-- Normal cell content -->
            <td v-else
                class="cell-content"
                :class="{ 'null': cell === null, }">{{ cell }}</td>
        </template>
    </tr>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as Record from "../../../common/Record";

// import * as AnnealAjax from "../data/AnnealAjax";
import * as ColumnInfo from "../data/ColumnInfo";

@Component
export default class SpreadsheetTreeViewItem extends Vue {
    // Props
    @Prop item: string | Record.Record = p({ required: true, }) as any;
    @Prop columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo> = p({ type: Array, required: true, }) as any;

    get numberOfColumns() {
        return this.columnInfo.length;
    }

    get isItemGroupHeading() {
        return typeof this.item === "string";
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
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
