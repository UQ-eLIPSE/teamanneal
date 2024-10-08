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
                    <option v-for="(option, i) in possibleIdColumns"
                            :key="option.text + i"
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

import { AnnealCreator as S } from "../../store";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class SelectIdColumn extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.selectIdColumn;

    /**
     * An array for the <select /> menu of all the possible ID columns to choose 
     * from.
     */
    get possibleIdColumns() {
        return S.get(S.getter.VALID_ID_COLUMNS)
            .map((column) => ({
                text: column.label,
                value: ColumnData.ConvertToMinimalDescriptor(column),
            }));
    }

    get idColumn() {
        const idColumn = S.state.recordData.idColumn;

        if (idColumn === undefined) {
            return undefined;
        }

        return idColumn;
    }

    set idColumn(val: IColumnData_MinimalDescriptor | undefined) {
        if (val === undefined) {
            S.dispatch(S.action.CLEAR_RECORD_ID_COLUMN, undefined);
        } else {
            S.dispatch(S.action.SET_RECORD_ID_COLUMN, val);
        }

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
