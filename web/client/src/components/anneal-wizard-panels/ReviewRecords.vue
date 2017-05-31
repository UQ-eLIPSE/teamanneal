<template>
    <div id="wizard">
        <div class="desc-text">
            <h1>Double check data</h1>
            <p>
                Take a moment to make sure column data types and all records are correct.
                <a class="more" href="#">Need help?</a>
            </p>
        </div>
        <div class="spreadsheet">
            <SpreadsheetView class="viewer" :rows="$store.state.sourceFile.data" />
        </div>
        <div class="bottom-buttons">
            <button class="button" @click="emitWizardNavNext">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import SpreadsheetView from "../SpreadsheetView.vue";

const thisWizardStep = AnnealProcessWizardEntries.reviewRecords;

@Component({
    components: {
        SpreadsheetView,
    },
})
export default class ReviewRecords extends Vue {
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
    display: flex;
    flex-direction: column;
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
    /*margin: 0 -2rem -1rem;*/
    padding: 1rem 2rem;

    display: flex;
    flex-direction: row-reverse;

    flex-grow: 0;
    flex-shrink: 0;
}

#wizard .bottom-buttons>* {
    margin: 0 0.2em;
}

.desc-text {
    padding: 1rem 2rem;

    flex-grow: 0;
    flex-shrink: 0;
}

.spreadsheet {
    background: #fff;

    flex-grow: 1;
    flex-shrink: 0;

    position: relative;
}

.spreadsheet .viewer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
</style>
