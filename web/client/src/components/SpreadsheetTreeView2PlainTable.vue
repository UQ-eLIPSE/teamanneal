<template>
    <tbody>
        <tr v-for="(row, i) in recordRows"
            :key="i"
            class="record-content">
            <td v-if="depth > 0"
                class="leading-pad-cell"
                :colspan="depth"></td>
            <td v-for="(cellValue, j) in row"
                :key="i + '_' + j"
                :class="getCellClasses(cellValue)">{{ getCellDisplayedValue(cellValue) }}</td>
        </tr>
    </tbody>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { RecordElement, RecordSet } from "../../../common/Record";


@Component
export default class SpreadsheetTreeView2PlainTable extends Vue {
    // Props
    @Prop recordRows = p<RecordSet>({ type: Array, required: true, });
    @Prop depth = p({ type: Number, required: false, default: 0, });


    /** Returns the classes to apply to cells of a given value */
    getCellClasses(cellValue: RecordElement) {
        return {
            "nan": Number.isNaN(cellValue as any),
            "null": cellValue === null,
        };
    }

    /** Returns the string to display for cells of a given value */
    getCellDisplayedValue(cellValue: RecordElement) {
        if (cellValue === null) {
            return undefined;
        }

        return "" + cellValue;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.record-content td {
    border: 1px solid #ddd;
    text-align: inherit;

    padding: 0.5em;

    white-space: nowrap;
}

.record-content .leading-pad-cell {
    border: 0;
    padding: 0;
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
