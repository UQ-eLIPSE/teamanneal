<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Configure groups</h1>
            <p>
                Here you can configure the sizes of each group and subgroups, and how output groups are labelled after annealing.
                <a class="more help-link"
                   :class="{'active': showHelp}"
                   href="#"
                   @click.prevent="toggleHelp">Need help?</a>
            </p>
            <div class="help-box"
                 v-if="showHelp">
                <h2>How group size parameters are considered</h2>
                <p>TeamAnneal will attempt to create as many groups as possible with the
                    <b>ideal</b> size. In the event that it cannot do so, it will attempt to vary the number per group.</p>
                <p>In all circumstances, TeamAnneal will always form groups within the
                    <b>minimum</b> and
                    <b>maximum</b> sizes that you set.</p>
    
                <h2>How to configure group names</h2>
                <p>For each group, you can use the dropdown to set the particular type of name you would like. A preview is given to help you get a sense of what this will look like.</p>
                <p>If you wish to use a custom list of names, choose "Custom list" from the dropdown and fill in one name per line.</p>
    
                <h2>When group names are generated and applied</h2>
                <p>Because groups have not yet been formed at this stage, you will not be able to see what the generated group names will be.</p>
                <p>TeamAnneal generates and applies group names after annealing; you will be able to see this clearly labelled on each team on the results page once the process is complete.</p>
            </div>
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
