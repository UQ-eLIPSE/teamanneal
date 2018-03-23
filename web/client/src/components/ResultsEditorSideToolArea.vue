<template>
    <div class="results-editor-side-tool-area">
        <ResultsEditorMenuBar :items="menuBarItems"
                              :selectedItem="selectedItem"
                              @itemSelected="onItemSelected"></ResultsEditorMenuBar>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { MenuItem } from "../data/ResultsEditorMenuBar";

import ResultsEditorMenuBar from "./ResultsEditorMenuBar.vue";

const MENU_BAR_ITEMS: ReadonlyArray<MenuItem> = [
    {
        label: "Save and Export",
        region: "start",
    },
    {
        label: "Print",
        region: "start",
    },
    {
        label: "Move a person",
    },
    {
        label: "Swap people",
    },
    {
        label: "Add a person or group",
    },
    {
        label: "Remove a person or group",
    },
    {
        label: "Help",
        region: "end",
    },
]

@Component({
    components: {
        ResultsEditorMenuBar,
    },
})
export default class ResultsEditorSideToolArea extends Vue {
    /** Which menu item is currently selected */
    selectedItem: MenuItem | undefined = undefined;

    get menuBarItems() {
        return MENU_BAR_ITEMS;
    }

    onItemSelected(item: MenuItem) {
        if (this.selectedItem === item) {
            this.selectedItem = undefined;
            return;
        }

        this.selectedItem = item;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.results-editor-side-tool-area {
    display: flex;
    flex-direction: row;
}
</style>
