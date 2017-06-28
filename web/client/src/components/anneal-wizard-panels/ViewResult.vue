<template>
    <div id="wizard">
        <h1>View result</h1>
    
        <p v-if="isRequestInProgress"
           style="color: #fff; background: darkred; padding: 0.5em;">
            Request in progress... (see console)
        </p>
        <div v-if="rootNodeAvailable">
            <SpreadsheetTreeView :tree="rootNode"
                                 :columnInfo="columnInfo"></SpreadsheetTreeView>
        </div>
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

import * as SourceFile from "../../data/SourceFile";
import * as TeamAnnealState from "../../data/TeamAnnealState";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import ResultArrayNodeView from "../ResultArrayNodeView.vue";
import SpreadsheetTreeView from "../SpreadsheetTreeView.vue";

const thisWizardStep = AnnealProcessWizardEntries.viewResult;

@Component({
    components: {
        ResultArrayNodeView,
        SpreadsheetTreeView,
    }
})
export default class ViewResult extends Vue {
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

    get isRequestInProgress() {
        return TeamAnnealState.isAnnealRequestInProgress(this.$store.state);
    }

    get rootNodeAvailable() {
        return this.$store.state.anneal.outputTree && this.$store.state.anneal.outputTree.children.length > 0;
    }

    get rootNode() {
        return this.$store.state.anneal.outputTree;
    }

    get rootNodeChildren() {
        return this.rootNode.children;
    }

    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    get columnInfo() {
        return this.fileInStore.columnInfo;
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
</style>
