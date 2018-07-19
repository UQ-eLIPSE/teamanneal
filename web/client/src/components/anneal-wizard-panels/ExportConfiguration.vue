<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Export configuration</h1>
            <div v-if="configHasError"
                 class="error-msg">
                <h3>Your TeamAnneal configuration has some errors, but it can still be downloaded</h3>
            </div>
            <p>
                You can export your TeamAnneal configuration by clicking on the button below.
            </p>
            <p>
                This saves all group parameters and constraints you've entered so far into one file that you can keep or share with others. Note that this
                <b>does not</b> include record data.
            </p>
            <p>
                To use this exported configuration file in future, simply return to the TeamAnneal Creator, import both a CSV records file and this configuration file.
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="exportConfig">Export configuration</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";
import * as FileSaver from "file-saver";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealCreator as S } from "../../store";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class ExportConfiguration extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.exportData;

    async exportConfig() {
        // Get state serialised and save as TeamAnneal anneal config file 
        // (just a JSON file internally)
        const serialisedContent = await S.dispatch(S.action.DEHYDRATE, { deleteRecordDataSource: true, deleteAnnealRequest: true });

        const fileBlob = new Blob([serialisedContent], { type: "application/json" });

        FileSaver.saveAs(fileBlob, `export-${Date.now()}.taconfig`, true);
    }
    
    get configHasError() {
        return !S.get(S.getter.IS_ANNEAL_ABLE_TO_BE_EXECUTED);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>

