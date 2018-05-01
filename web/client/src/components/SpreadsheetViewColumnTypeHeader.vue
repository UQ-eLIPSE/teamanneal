<template>
    <th :class="tableHeaderClasses">
        <span class="cell-content">{{ column.label }}</span>
        <br>
        <select ref="column-type"
                class="column-type"
                title="Select a column type"
                v-model="columnType">
            <option value="string">text</option>
            <option value="number">number</option>
        </select>
    </th>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { deepCopy, deepMerge } from "../util/Object";

import { Data as IColumnData } from "../data/ColumnData";

import { AnnealCreator as S } from "../store";

@Component
export default class SpreadsheetViewColumnTypeHeader extends Vue {
    // Props
    @Prop column = p<IColumnData>({ required: true, });
    @Prop invalidColumn = p<boolean>({ required: false, default: () => false });

    get columnType() {
        return this.column.type;
    }

    set columnType(newColumnType: "number" | "string") {
        const selectElement = this.$refs["column-type"] as HTMLSelectElement;

        const newColumnData = deepMerge(deepCopy(this.column), {
            type: newColumnType,
        });

        S.dispatch(S.action.UPDATE_RECORD_COLUMN_DATA, newColumnData)
            .then(() => {
                // There is an issue with keeping the <select> element in sync
                // with the store value when the updates don't go through
                // (e.g. in the instance that a column type change is not
                // permitted)
                // 
                // We wait until the column type updating is done and then
                // force the <select> to have the value that is in the store
                selectElement.value = this.columnType;
            });
    }

    get tableHeaderClasses() {
        return {
            'error': this.invalidColumn
        }
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

.error {
    background-color: darkorange;
    color: black;
}
</style>
