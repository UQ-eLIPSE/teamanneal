<template>
    <th>
        <span class="cell-content">{{ column.label }}</span>
        <br>
        <select class="column-type"
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

@Component
export default class SpreadsheetViewColumnTypeHeader extends Vue {
    // Props
    @Prop column: IColumnData = p({ type: Object, required: true, }) as any;

    get columnType() {
        return this.column.type;
    }

    set columnType(newColumnType: "number" | "string") {
        const selectElement = this.$el.getElementsByClassName("column-type")[0] as HTMLSelectElement;

        const newColumnData = deepMerge(deepCopy(this.column), {
            type: newColumnType,
        });

        this.$store.dispatch("updateColumnData", newColumnData)
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
