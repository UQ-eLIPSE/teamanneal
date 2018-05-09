<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Welcome</h1>
            <p>The TeamAnneal Creator steps you through configuring the anneal process to form teams using constraints you define.</p>
            <p>To begin, choose either to load a new data file with records of people, or import an existing TeamAnneal configuration file.</p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="moveToImportLoadDataFile">Load new data file</button>
            <button class="button secondary"
                    @click="moveToImportLoadConfigFile">Import existing configuration</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealCreator as S } from "../../store";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class Welcome extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.welcome;

    moveToImportLoadDataFile() {
        S.dispatch(S.action.SET_DATA_IMPORT_MODE, "new-records-file");
        this.goToImport();
    }

    moveToImportLoadConfigFile() {
        S.dispatch(S.action.SET_DATA_IMPORT_MODE, "import-config-file-with-separate-records-file");
        this.goToImport();
    }

    goToImport() {
        this.$router.push({
            name: "anneal-import-data",
        });
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>

</style>
