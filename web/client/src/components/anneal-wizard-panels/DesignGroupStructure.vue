<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Design group structure</h1>
            <p>
                Add, remove and relabel subgroups to form the group structure you want.
                <a class="more"
                   href="#">Need help?</a>
            </p>
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
import { Component, Mixin } from "av-ts";

import * as TeamAnnealState from "../../data/TeamAnnealState";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import StrataStructureEditor from "../StrataStructureEditor.vue";

@Component({
    components: {
        StrataStructureEditor,
    }
})
export default class DesignGroupStructure extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.designGroupStructure;

    get isStrataConfigNamesValid() {
        return TeamAnnealState.isStrataConfigNamesValid(this.$store.state);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
@import "../../static/anneal-process-wizard-panel.css";

.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
