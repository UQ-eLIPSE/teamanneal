<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Select ID column</h1>
            <p>
                TeamAnneal needs to know which column identifies each unique record in your data.
                <a class="more help-link"
                   :class="{'active': showHelp}"
                   href="#"
                   @click.prevent="toggleHelp">Need help?</a>
            </p>
            <div class="help-box"
                 v-if="showHelp">
                <h2>Available ID columns</h2>
                <p>TeamAnneal only shows you columns which can be validly used as an ID - those which uniquely identify each person's record, such as a student ID or email address.</p>
                <p>If there are no available ID columns to choose from, make sure that your data set has at least one column which has a unique value for each row.</p>
            </div>
            <div v-if="possibleIdColumns.length === 0"
                 class="error-msg">
                <h3>Your records file has no detected ID column</h3>
                <p>Please ensure that your records file has a column with one unique ID value per record.</p>
            </div>
            <p>
                <select v-model="idColumnIndex">
                    <option disabled
                            value="-1">Please select ID column</option>
                    <option v-for="option in possibleIdColumns"
                            :key="option.value"
                            :value="option.value">{{ option.text }}</option>
                </select>
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

import * as SourceFile from "../../data/SourceFile";
import * as ConstraintsConfig from "../../data/ConstraintsConfig";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class SelectIdColumn extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.selectIdColumn;

    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    get constraintsConfigInStore() {
        const config: ConstraintsConfig.ConstraintsConfig = this.$store.state.constraintsConfig;
        return config;
    }

    /**
     * An array for the <select /> menu of all the possible ID columns to choose 
     * from.
     */
    get possibleIdColumns() {
        const allRawData = this.fileInStore.rawData;
        const columnInfo = this.fileInStore.columnInfo || [];

        // No data to even process
        if (allRawData === undefined || allRawData.length === 0) { return []; }

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = allRawData.length - 1;

        // Filter only those with column values unique
        return columnInfo
            .filter(info => info.valueSet.size === numberOfRecords)
            .map(info => ({ text: info.label, value: columnInfo.indexOf(info) }));
    }






    get idColumnIndex(): string {
        // NOTE: Returns string as <select> doesn't do numbers
        const idColumnIndex = this.constraintsConfigInStore.idColumnIndex;

        if (idColumnIndex === undefined) {
            return "-1";
        }

        return idColumnIndex.toString();
    }

    set idColumnIndex(val: string) {
        const idColumnIndex = +val;     // Convert to number 
        this.$store.commit("updateConstraintsConfigIdColumnIndex", idColumnIndex);
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
