<template>
    <div class="results-editor-menu-bar">
        <div class="start-align aligned-items">
            <button v-for="item in startAlignedItems"
                    :key="item.label"
                    class="menu-item"
                    :title="item.label">{{ item.label }}</button>
        </div>
        <div class="center-align aligned-items">
            <button v-for="item in centerAlignedItems"
                    :key="item.label"
                    class="menu-item"
                    :title="item.label">{{ item.label }}</button>
        </div>
        <div class="end-align aligned-items">
            <button v-for="item in endAlignedItems"
                    :key="item.label"
                    class="menu-item"
                    :title="item.label">{{ item.label }}</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { MenuItem } from "../data/ResultsEditorMenuBar";

@Component
export default class ResultsEditorMenuBar extends Vue {
    @Prop items = p<ReadonlyArray<MenuItem>>({ type: Array, required: false, default: () => [], });

    get startAlignedItems() {
        return this.items.filter(item => item.region === "start");
    }

    get centerAlignedItems() {
        return this.items.filter(item => item.region !== "start" && item.region !== "end");
    }

    get endAlignedItems() {
        return this.items.filter(item => item.region === "end");
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

    border: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;

    background: none;
    
    font: inherit;
    color: inherit;
    text-align: inherit;
    text-decoration: inherit;

    line-height: normal;

    -webkit-appearance: none;
}
</style>
