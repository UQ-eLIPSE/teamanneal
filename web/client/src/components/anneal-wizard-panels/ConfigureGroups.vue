<template>
    <div id="wizard">
        <h1>Configure groups</h1>
        <p>
            Here you can configure the sizes of each group and subgroups, and how output groups are labelled after annealing.
            <a class="more"
               href="#">Need help?</a>
        </p>
        <p>
            <StrataEditor />
        </p>
        <div class="bottom-buttons">
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

import StrataEditor from "../StrataEditor.vue";

const thisWizardStep = AnnealProcessWizardEntries.configureGroups;

@Component({
    components: {
        StrataEditor,
    }
})
export default class ConfigureGroups extends Vue {
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
        if (!this.isStrataConfigSizesValid) { return true; }

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

    get isStrataConfigSizesValid() {
        return TeamAnnealState.isStrataConfigSizesValid(this.$store.state);
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
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    background: #e6e6e6;
    margin: 0 -2rem -1rem;
    padding: 1rem 2rem;

    display: flex;
    flex-direction: row-reverse;

    position: sticky;
    bottom: -1px;
}

#wizard .bottom-buttons>* {
    margin: 0 0.2em;
}

.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
