<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Export configuration</h1>
            <p>
                You can export your TeamAnneal configuration by clicking on the button below. This saves all group parameters and constraints you've entered so far into one file that you can keep or share with others.
            </p>
            <p>
                To use this exported configuration file in future, simply return to the TeamAnneal Creator, and choose to import the configuration file.
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
export default class ExportData extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.exportData;

    async exportConfig() {
        // Get state serialised and save as TeamAnneal anneal config file 
        // (just a JSON file internally)
        const serialisedContent = await S.dispatch(S.action.DEHYDRATE, { deleteDataImportMode: true, deleteRecordDataSource: true, deleteAnnealRequest: true });

        const fileBlob = new Blob([serialisedContent], { type: "application/json" });

        FileSaver.saveAs(fileBlob, `export-${Date.now()}.taconfig`, true);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>

</style>
