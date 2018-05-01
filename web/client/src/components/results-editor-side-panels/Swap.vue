<template>
    <div class="swap-people">
        <h2>Swap</h2>
        <div class="form-block">
            <label for="person-a-select">Swap:</label>
            <div class="click-input-field-block"
                 :class="personAFieldBlockClasses">
                <button id="person-a-select"
                        class="input-field"
                        data-placeholder-text="(Person)"
                        @focus="setCursor('personA')"
                        @click="setCursor('personA')">{{ personAFieldBlockText }}</button>
                <!-- <button v-if="xxx !== undefined">View</button> -->
                <button v-if="data.personA !== undefined"
                        @click="clearPersonA">Clear</button>
            </div>
        </div>
        <div class="form-block">
            <label for="person-b-select">... with:</label>
            <div class="click-input-field-block"
                 :class="personBFieldBlockClasses">
                <button id="person-b-select"
                        class="input-field"
                        data-placeholder-text="(Person)"
                        @focus="setCursor('personB')"
                        @click="setCursor('personB')">{{ personBFieldBlockText }}</button>
                <!-- <button v-if="xxx !== undefined">View</button> -->
                <button v-if="data.personB !== undefined"
                        @click="clearPersonB">Clear</button>
            </div>
        </div>
        <div class="form-block">
            <button class="button secondary small">Advanced...</button>
        </div>
        <div class="form-block"
             style="text-align: right;">
            <button class="button small"
                    @click="commitSwap">Swap</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { ResultsEditor as S } from "../../store";

import { SwapSidePanelToolData } from "../../data/SwapSidePanelToolData";

@Component
export default class Swap extends Vue {
    get data() {
        return (S.state.sideToolArea.activeItem!.data || {}) as SwapSidePanelToolData;
    }

    get personAFieldBlockClasses() {
        return {
            "active": this.data.cursor === "personA",
        };
    }

    get personBFieldBlockClasses() {
        return {
            "active": this.data.cursor === "personB",
        };
    }

    get personAFieldBlockText() {
        return this.data.personA && this.data.personA.id;
    }

    get personBFieldBlockText() {
        return this.data.personB && this.data.personB.id;
    }

    async setCursor(target: "personA" | "personB" | undefined) {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { cursor: target });
    }

    async clearPersonA() {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { personA: undefined });
        await this.setCursor("personA");
    }

    async clearPersonB() {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { personB: undefined });
        await this.setCursor("personB");
    }

    async commitSwap() {
        const { personA, personB } = this.data;

        if (personA === undefined || personB === undefined) {
            // TODO: Proper error handling
            throw new Error("Underspecified swap operation");
        }

        await S.dispatch(S.action.SWAP_RECORDS, { personA, personB });

        // TODO: Review whether we should close the side panel or not
        await S.dispatch(S.action.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
