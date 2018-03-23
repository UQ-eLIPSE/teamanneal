<template>
    <div class="results-editor-side-tool-area">
        <div v-if="sidePanelEnabled"
             class="side-panel">
            <component class="side-panel-component"
                       :is="sidePanelComponent"></component>
        </div>
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

import ImportFile from "./results-editor-side-panels/ImportFile.vue";

const MENU_BAR_ITEMS: ReadonlyArray<MenuItem> = [
    {
        label: "Import",
        region: "start",
        component: ImportFile,
    },
    {
        label: "Export",
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

    get sidePanelComponent() {
        if (this.selectedItem === undefined) {
            return undefined;
        }

        return this.selectedItem.component;
    }

    get sidePanelEnabled() {
        return this.selectedItem !== undefined && this.selectedItem.component !== undefined;
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

.side-panel {
    background: #ccc;

    width: 25vw;
    min-width: 20em;
    max-width: 40em;

    position: relative;
}

.side-panel-component {
    position: absolute;

    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
</style>
