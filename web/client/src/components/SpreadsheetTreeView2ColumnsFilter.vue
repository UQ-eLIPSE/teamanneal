<template>
    <div class="filter-checkboxes">
        <label class="filter-checkbox"
               v-for="(item, i) in items"
               :key="i">{{item.label}}
            <input type="checkbox"
                   :value="i"
                   @change="updated"
                   v-model="selectedItems">
        </label>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p, Lifecycle } from "av-ts";
import { Data as IColumnData } from "../data/ColumnData";

@Component
export default class SpreadsheetTreeView2ColumnsFilter extends Vue {
    @Prop items = p<IColumnData[]>({ required: true });

    // Private
    selectedItems: number[] = [];

    updated() {
        this.$emit("listUpdated", this.selectedItems);
    }

    @Lifecycle
    created() {
        this.selectedItems = this.items.map((_x: any, i: number) => i);
        this.updated();
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
.filter-checkboxes {
    display: flex;
    align-items: center;
    font-size: 0.8em;
    background: rgb(240, 240, 240);
    padding: 0 0.5rem;
    overflow-x: scroll;
    flex-shrink: 0;
}

.filter-checkbox {
    display: flex;
    align-items: center;
    padding: 0.8rem;
    cursor: pointer;
    border-right: 0.05em solid rgba(100, 100, 100, 0.2);
}

.filter-checkbox>input {
    cursor: pointer;
}

.filter-checkbox:hover,
.filter-checkbox:active,
.filter-checkbox:focus {
    background-color: rgba(73, 7, 94, 0.1);
    outline: 0.01em solid rgba(73, 7, 94, 0.8);
}
</style>
