<template>
    <div id="wizard">
        <h1>Configure output groups</h1>
        <p>
            Here you can change how your output groups should look like. You can add, remove, reorder and relabel groups, in addition to configuring their sizes.
            <a class="more" href="#">Need help?</a>
        </p>
        <p>
            <StrataEditor />
        </p>
        <div class="bottom-buttons">
            <button class="button" @click="emitWizardNavNext" :disabled="isWizardNavNextDisabled">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import StrataEditor from "../StrataEditor.vue";

const thisWizardStep = AnnealProcessWizardEntries.configureOutputGroups;

@Component({
    components: {
        StrataEditor,
    }
})
export default class ConfigureOutputGroups extends Vue {
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
}
</script>

<!-- ####################################################################### -->

<style scoped>
#wizard {
    padding: 1rem 2rem;
}

#wizard h1 {
    color: #49075E;
    font-weight: 400;
    font-size: 2.5em;
    margin: 1rem 0;
}

#wizard p {
    margin: 1rem 0;
}

#wizard .bottom-buttons {
    background: rgba(0, 0, 0, 0.05);
    margin: 0 -2rem -1rem;
    padding: 1rem 2rem;

    display: flex;
    flex-direction: row-reverse;
}

#wizard .bottom-buttons>* {
    margin: 0 0.2em;
}
</style>
