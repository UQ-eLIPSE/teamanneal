<template>
    <div class="results-editor-menu-bar">
        <div class="start-align aligned-items">
            <button v-for="item in startAlignedItems"
                    :key="item.label"
                    class="menu-item"
                    :class="menuItemClasses(item)"
                    :title="item.label"
                    @click="onMenuItemClick(item)">{{ item.label }}</button>
        </div>
        <div class="center-align aligned-items">
            <button v-for="item in centerAlignedItems"
                    :key="item.label"
                    class="menu-item"
                    :class="menuItemClasses(item)"
                    :title="item.label"
                    @click="onMenuItemClick(item)">{{ item.label }}</button>
        </div>
        <div class="end-align aligned-items">
            <button v-for="item in endAlignedItems"
                    :key="item.label"
                    class="menu-item"
                    :class="menuItemClasses(item)"
                    :title="item.label"
                    @click="onMenuItemClick(item)">{{ item.label }}</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { MenuItem } from "../data/ResultsEditorMenuBar";

@Component
export default class ResultsEditorMenuBar extends Vue {
    /** Menu items */
    @Prop items = p<ReadonlyArray<MenuItem>>({ type: Array, required: false, default: () => [], });
    
    /** Which menu item is currently selected */
    @Prop selectedItem = p<MenuItem>({ required: false, });

    get startAlignedItems() {
        return this.items.filter(item => item.region === "start");
    }

    get centerAlignedItems() {
        return this.items.filter(item => item.region !== "start" && item.region !== "end");
    }

    get endAlignedItems() {
        return this.items.filter(item => item.region === "end");
    }

    menuItemClasses(item: MenuItem) {
        return {
            "selected": this.selectedItem === item, 
        };
    }

    onMenuItemClick(item: MenuItem) {
        this.$emit("itemSelected", item);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.results-editor-menu-bar {
    display: flex;
    flex-direction: column;

    background: #49075e;
    color: #fff;

    width: 4em;
}

.aligned-items {
    flex-grow: 1;
    flex-shrink: 0;
    flex-basis: 0;

    display: flex;
    flex-direction: column;
}

.start-align {
    justify-content: flex-start;
}

.center-align {
    justify-content: center;
}

.end-align {
    justify-content: flex-end;
}

.menu-item {
    width: 4em;
    height: 4em;
    
    flex-grow: 0;
    flex-shrink: 0;

    border: 0;
    margin: 0;
    padding: 0.3em;
    overflow: hidden;

    background: none;
    
    font: inherit;
    color: inherit;
    text-align: inherit;
    text-decoration: inherit;

    line-height: normal;

    -webkit-appearance: none;
}

.menu-item.selected {
    background: #ccc;
    color: #000;
}
</style>
