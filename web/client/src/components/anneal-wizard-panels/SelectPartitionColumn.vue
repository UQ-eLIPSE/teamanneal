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
                            value="-1">Please select a partition column</option>
                    <option v-for="option in possiblePartitionColumns"
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
import { Vue, Component } from "av-ts";

import * as SourceFile from "../../data/SourceFile";
import * as ConstraintsConfig from "../../data/ConstraintsConfig";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

const thisWizardStep = AnnealProcessWizardEntries.selectPartitionColumn;

@Component
export default class SelectPartitionColumn extends Vue {
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
        const columnInfo = this.fileInStore.columnInfo || [];
        return columnInfo.map((info, i) => ({ text: info.label, value: i }));
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
