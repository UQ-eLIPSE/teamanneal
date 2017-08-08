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
                <select v-model="idColumn">
                    <option disabled
                            :value="undefined">Please select ID column</option>
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

import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import { StoreState } from "../StoreState";

@Component
export default class SelectIdColumn extends Mixin(StoreState, AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.selectIdColumn;

    /**
     * An array for the <select /> menu of all the possible ID columns to choose 
     * from.
     */
    get possibleIdColumns() {
        const columns = this.state.recordData.columns;
        const recordDataRawLength = this.state.recordData.source.length;

        // No data to even process
        if (columns.length === 0) { return []; }

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = recordDataRawLength - 1;

        // Filter only those with column values unique
        return columns
            .filter((column) => {
                const valueSet = ColumnData.GetValueSet(column);
                return valueSet.size === numberOfRecords;
            })
            .map((column) => ({
                text: column.label,
                value: ColumnData.ConvertToMinimalDescriptor(column),
            }));
    }

    get idColumn(): IColumnData_MinimalDescriptor | undefined {
        const idColumn = this.state.recordData.idColumn;

        if (idColumn === undefined) {
            return undefined;
        }

        return idColumn;
    }

    set idColumn(val: IColumnData_MinimalDescriptor | undefined) {
        this.$store.dispatch("setIdColumn", val);
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
