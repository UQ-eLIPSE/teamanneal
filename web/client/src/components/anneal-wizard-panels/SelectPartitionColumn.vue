<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Select partition column</h1>
            <p>
                If you need teams to be formed within clusters of records, select a column to partition your data over.
                <a class="more"
                   href="#">Need help?</a>
            </p>
            <p>
                For example, you may have students in assigned project types - teams may need to be comprised of those in the same project. In this situation, you would set the project column as the partition column.
            </p>
            <p>
                <select v-model="partitionColumnIndex">
                    <option disabled
                            value="-1">Please select partition column</option>
                    <option v-for="option in possiblePartitionColumns"
                            :key="option.value"
                            :value="option.value">{{ option.text }}</option>
                </select>
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="setPartitionColumn"
                    :disabled="partitionColumnIndex === '-1'">Set partition column</button>
            <button class="button gold"
                    @click="skipPartitioning">Don't partition</button>
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
export default class SelectPartitionColumn extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.selectPartitionColumn;

    setPartitionColumn() {
        this.emitWizardNavNext();
    }

    skipPartitioning() {
        // Delete partition column index
        this.$store.commit("deleteConstraintsConfigPartitionColumnIndex");
        this.emitWizardNavNext();
    }

    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    get constraintsConfigInStore() {
        const config: Partial<ConstraintsConfig.ConstraintsConfig> = this.$store.state.constraintsConfig;
        return config;
    }

    get possiblePartitionColumns() {
        const allRawData = this.fileInStore.rawData;
        const columnInfo = this.fileInStore.columnInfo || [];

        // No data to even process
        if (allRawData === undefined || allRawData.length === 0) { return []; }

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = allRawData.length - 1;

        // Filter only those with column values non-unique (i.e. drop ID-like 
        // columns)
        return columnInfo
            .filter(info => info.valueSet.size !== numberOfRecords)
            .map(info => ({ text: info.label, value: columnInfo.indexOf(info) }));
    }

    get partitionColumnIndex(): string {
        // NOTE: Returns string as <select> doesn't do numbers
        const partitionColumnIndex = this.constraintsConfigInStore.partitionColumnIndex;

        if (partitionColumnIndex === undefined) {
            return "-1";
        }

        return partitionColumnIndex.toString();
    }

    set partitionColumnIndex(val: string) {
        const partitionColumnIndex = +val;     // Convert to number 
        this.$store.commit("updateConstraintsConfigPartitionColumnIndex", partitionColumnIndex);
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
