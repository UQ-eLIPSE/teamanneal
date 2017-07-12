<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Select ID column</h1>
            <p>
                TeamAnneal needs to know which column identifies each unique record in your data.
                <a class="more"
                   href="#">Need help?</a>
            </p>
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
        const config: Partial<ConstraintsConfig.ConstraintsConfig> = this.$store.state.constraintsConfig;
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
