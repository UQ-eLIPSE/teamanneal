<template>
    <div class="results-editor-side-tool-area">
        <div v-if="sidePanelEnabled"
             class="side-panel">
            <component class="side-panel-component"
                       :is="sidePanelComponent"></component>
        </div>
        <ResultsEditorMenuBar :items="menuItems"
                              :selectedItem="selectedItem"
                              @itemSelected="onItemSelected"></ResultsEditorMenuBar>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { MenuItem } from "../data/ResultsEditorMenuBar";

import * as Store from "../store";

import ResultsEditorMenuBar from "./ResultsEditorMenuBar.vue";

@Component({
    components: {
        ResultsEditorMenuBar,
    },
})
export default class ResultsEditorSideToolArea extends Vue {
    /** Array of menu items to render */
    @Prop menuItems = p<ReadonlyArray<MenuItem>>({ type: Array, required: true, });

    get sidePanelComponent() {
        if (this.selectedItem === undefined) {
            return undefined;
        }

        return this.selectedItem.component;
    }

    get sidePanelEnabled() {
        return this.selectedItem !== undefined && this.selectedItem.component !== undefined;
    }

    get selectedItem() {
        const itemInfo = Store.ResultsEditor.state.sideToolArea.activeItem;

        if (itemInfo === undefined) {
            return undefined;
        }

        return this.menuItems.find(item => item.name === itemInfo.name);
    }

    onItemSelected(item: MenuItem) {
        if (this.selectedItem === item) {
            return this.setActiveTool(undefined);
        }

        return this.setActiveTool(item.name);
    }

    setActiveTool(name: string | undefined) {
        if (name === undefined) {
            return Store.ResultsEditor.dispatch(Store.ResultsEditor.action.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
        }

        return Store.ResultsEditor.dispatch(Store.ResultsEditor.action.SET_SIDE_PANEL_ACTIVE_TOOL_BY_NAME, name);
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

    padding: 1em;

    overflow-y: auto;
}
</style>
