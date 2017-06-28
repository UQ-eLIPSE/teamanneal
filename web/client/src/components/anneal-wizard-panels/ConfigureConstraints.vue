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
            <!--<button class="button" @click="emitWizardNavNext" :disabled="isWizardNavNextDisabled">Continue</button>-->
            <button class="button"
                    @click="onAnnealButtonClick">Anneal</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";
import * as AnnealAjax from "../../data/AnnealAjax";

import ConstraintsEditor from "../ConstraintsEditor.vue";

const thisWizardStep = AnnealProcessWizardEntries.configureConstraints;

@Component({
    components: {
        ConstraintsEditor,
    },
})
export default class ConfigureConstraints extends Vue {
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
</style>
