<template>
    <th>
        <span class="cell-content">{{ column.label }}</span>
        <br>
        <select class="column-type"
                v-model="columnType">
            <option>string</option>
            <option>number</option>
        </select>
    </th>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as ColumnInfo from "../data/ColumnInfo";

@Component
export default class SpreadsheetViewColumnTypeHeader extends Vue {
    // Props
    @Prop column: ColumnInfo.ColumnInfo = p({ type: Object, required: true, }) as any;

    get columnType() {
        return this.column.type;
    }

    set columnType(newColumnType: string) {
        const columnInfo = this.column;

        // If no change, then nothing to do
        if (columnInfo.type === newColumnType) { return; }

        // If the column type changed, then trigger store update action
        const updateData: ColumnInfo.ChangeTypeUpdate = {
            columnInfo,
            newColumnType,
        }

        this.$store.dispatch("updateColumnType", updateData);
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
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
    border-radius: 0;
    font-size: 0.7em;
}
</style>
