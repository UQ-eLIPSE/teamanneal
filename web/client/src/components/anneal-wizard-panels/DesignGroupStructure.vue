<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Define group structure</h1>
            <p>
                Add and remove subgroups to form the group structure you want. Click on the name to relabel the group.
                <a class="more help-link"
                   :class="{'active': showHelp}"
                   href="#"
                   @click.prevent="toggleHelp">Need help?</a>
            </p>
            <div class="help-box"
                 v-if="showHelp">
                <h2>How groups are nested</h2>
                <p>Each group that is presented in the editor below are structured to nest top down.</p>
                <p>For example, with a two level structure:</p>
                <p>
                    <img src="data:image/png;base64,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">
                </p>
                <p>In the above example, multiple "subgroups" are formed under each "team".</p>
    
                <h2>Group limitations</h2>
                <p>At present, groups can be created up to two levels deep (excluding partitions.)</p>
            </div>
            <div v-if="!isStrataConfigNamesValid"
                 class="error-msg">
                <h3>Group structure is not valid</h3>
                <p>You have groups with blank or conflicting names. Please correct this before continuing.</p>
            </div>
            <p>
                <StrataStructureEditor></StrataStructureEditor>
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="emitWizardNavNext"
                    :disabled="isWizardNavNextDisabled">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Mixin } from "av-ts";

import { State } from "../../data/State";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import { StoreState } from "../StoreState";

import StrataStructureEditor from "../StrataStructureEditor.vue";

@Component({
    components: {
        StrataStructureEditor: StrataStructureEditor as Vue.Component,
    },
})
export default class DesignGroupStructure extends Mixin<StoreState & AnnealProcessWizardPanel>(StoreState, AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.designGroupStructure;

    get isStrataConfigNamesValid() {
        return State.IsStrataConfigNamesValid(this.state);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
