<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Configure constraints</h1>
            <p>
                TeamAnneal forms groups with consideration to constraints you provide. Add as many constraints as you need to describe desired properties for each group.
                <a class="more"
                   href="#">Need help?</a>
            </p>
            <p>
                <ConstraintsEditor></ConstraintsEditor>
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="onAnnealButtonClick">Anneal</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";
import * as AnnealAjax from "../../data/AnnealAjax";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import ConstraintsEditor from "../ConstraintsEditor.vue";

@Component({
    components: {
        ConstraintsEditor,
    },
})
export default class ConfigureConstraints extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.configureConstraints;

    onAnnealButtonClick() {
        // Convert state to anneal request input 
        const annealInput = AnnealAjax.transformStateToAnnealRequestBody(this.$store.state);

        // Fire off the anneal request
        this.$store.dispatch("newAnnealAjaxRequest", annealInput);

        // Go to next step regardless of what happens at this point
        this.emitWizardNavNext();
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>
