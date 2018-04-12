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
import { Vue, Component, Prop, p } from "av-ts";

import * as Store from "../../store";

import { SwapSidePanelToolData } from "../../data/SwapSidePanelToolData";

import { set, del } from "../../util/Vue";

@Component
export default class Swap extends Vue {
    @Prop data = p<SwapSidePanelToolData>({ required: true, });

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

    setCursor(target: "personA" | "personB" | undefined) {
        set(this.data, "cursor", target);
    }

    clearPersonA() {
        del(this.data, "personA");
        this.setCursor("personA");
    }

    clearPersonB() {
        del(this.data, "personB");
        this.setCursor("personB");
    }

    async commitSwap() {
        const { personA, personB } = this.data;

        if (personA === undefined || personB === undefined) {
            // TODO: Proper error handling
            throw new Error("Underspecified swap operation");
        }

        await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.SWAP_RECORDS, { personA, personB });

        // TODO: Review whether we should close the move side panel or not
        await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
