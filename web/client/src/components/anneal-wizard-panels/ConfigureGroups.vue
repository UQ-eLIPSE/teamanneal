<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Configure groups</h1>
            <p>
                Here you can configure the sizes of each group and subgroups, and how output groups are labelled after annealing.
                <a class="more"
                   href="#">Need help?</a>
            </p>
            <p>
                <StrataEditor></StrataEditor>
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
import StrataEditor from "../StrataEditor.vue";

@Component({
    components: {
        StrataEditor,
    }
})
export default class ConfigureGroups extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.configureGroups;

    get isStrataConfigSizesValid() {
        return TeamAnnealState.isStrataConfigSizesValid(this.$store.state);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>
