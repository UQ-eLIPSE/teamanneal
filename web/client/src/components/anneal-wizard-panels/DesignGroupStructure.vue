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
import { Vue, Component } from "av-ts";

import * as TeamAnnealState from "../../data/TeamAnnealState";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import StrataStructureEditor from "../StrataStructureEditor.vue";

const thisWizardStep = AnnealProcessWizardEntries.designGroupStructure;

@Component({
    components: {
        StrataStructureEditor,
    }
})
export default class DesignGroupStructure extends Vue {
    emitWizardNavNext() {
        // Don't go if next is disabled
        if (this.isWizardNavNextDisabled) {
            return;
        }

        this.$emit("wizardNavigation", {
            event: "next",
        });
    }

    get isWizardNavNextDisabled() {
        // Disable next step if strata is currently invalid
        if (!this.isStrataConfigNamesValid) { return true; }

        const state = this.$store.state;

        // Check if we have a next step defined
        if (thisWizardStep.next === undefined) { return false; }

        // Get the next step
        const next = thisWizardStep.next(state);

        // Get the disabled check function or say it is not disabled if the
        // function does not exist
        if (next.disabled === undefined) { return false; }
        const disabled = next.disabled(state);

        return disabled;
    }

    get isStrataConfigNamesValid() {
        return TeamAnnealState.isStrataConfigNamesValid(this.$store.state);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.wizard-panel {
    display: flex;
    flex-direction: column;
}

.wizard-panel-content {
    flex-grow: 0;
    flex-shrink: 1;

    padding: 1rem 2rem;

    overflow-y: auto;
}

.wizard-panel-content h1 {
    color: #49075E;
    font-weight: 400;
    font-size: 2.5em;
    margin: 1rem 0;
}

.wizard-panel-content p {
    margin: 1rem 0;
}

.wizard-panel-bottom-buttons {
    flex-grow: 0;
    flex-shrink: 0;

    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    background: #e6e6e6;
    padding: 1rem 2rem;

    margin-bottom: -1px;

    display: flex;
    flex-direction: row-reverse;
}

.wizard-panel-bottom-buttons>* {
    margin: 0 0.2em;
}

.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
