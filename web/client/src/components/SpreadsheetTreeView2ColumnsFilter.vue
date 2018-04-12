<template>
    <div class="filter">
        <div class="controls">
            <button class="control-button button secondary"
                    @click.prevent="deselectAllItems">De-select all</button>
            <button class="control-button button secondary"
                    @click.prevent="selectAllItems">Select all</button>
        </div>
        <div class="filter-checkboxes">
            <label class="filter-checkbox"
                   v-for="(item, i) in items"
                   :key="i">{{item.label}}
                <input type="checkbox"
                       :value="i"
                       v-model="selectedItemIndices">
            </label>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p, Lifecycle } from "av-ts";
import { Data as IColumnData } from "../data/ColumnData";

@Component
export default class SpreadsheetTreeView2ColumnsFilter extends Vue {
    @Prop items = p<ReadonlyArray<IColumnData>>({ type: Array, required: true, });
    @Prop selectedIndices = p<ReadonlyArray<number>>({ type: Array, required: true, });

    get selectedItemIndices() {
        return this.selectedIndices;
    }

    set selectedItemIndices(indices: ReadonlyArray<number>) {
        this.$emit("listUpdated", indices);
    }

    selectAllItems() {
        this.selectedItemIndices = this.items.map((_x: any, i: number) => i);
    }

    deselectAllItems() {
        this.selectedItemIndices = [];
    }
}   
</script>

<!-- ####################################################################### -->
<style scoped src="../static/stylesheet.css"></style>
<style scoped>
.filter {
    display: flex;
    flex-shrink: 0;
    background: rgb(240, 240, 240);
}

.controls {
    display: flex;
    flex-shrink: 0;
    justify-content: space-evenly;
    flex-direction: column;
    padding: 0.2rem 1rem;
    border-right: 0.05em solid rgba(100, 100, 100, 0.2);
}

.control-button {
    font-size: 0.8em;
    padding: 0.2rem;
}

.filter-checkboxes {
    display: flex;
    align-items: center;
    font-size: 0.8em;
    background: rgb(240, 240, 240);
    padding: 0 0.5rem;
    overflow-x: scroll;
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
