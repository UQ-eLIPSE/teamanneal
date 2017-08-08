<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <div class="desc-text">
                <h1>Review data</h1>
                <p>
                    Take a moment to make sure column data types and all records are correct.
                    <a class="more help-link"
                       :class="{'active': showHelp}"
                       href="#"
                       @click.prevent="toggleHelp">Need help?</a>
                </p>
                <p>If you need to reload the file, simply click on the file name in the sidebar, click "Clear File" and try again.</p>
                <div class="help-box"
                     v-if="showHelp">
                    <h2>Choosing column types ("text", "number")</h2>
                    <p>Normally you do not need to worry about choosing a column type - TeamAnneal will automatically detect this and choose the most appropriate type for you.</p>
                    <p>If you believe that the type detection has incorrectly set the type of a column, you can switch between the two types by selecting the option from the dropdown menu in the header of the column in question. You will be able to see the result of the type conversion immediately in the viewer below.</p>
                    <p>Make sure that the values in the column are correct after you change the column type.</p>
    
                    <h2>Bad or incorrectly parsed data</h2>
                    <p>If the content in the viewer below appears to be invalid, check that your input CSV file is correctly formatted, reload the file and try again.</p>
                    <p>If you continue to encounter issues,
                        <a href="https://www.elipse.uq.edu.au/"
                           target="_blank">contact eLIPSE</a>.</p>
                </div>
            </div>
            <div class="spreadsheet">
                <SpreadsheetView class="viewer"
                                 :rows="cookedDataWithHeader"
                                 :columnData="columns"></SpreadsheetView>
            </div>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="emitWizardNavNext">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import { ColumnData } from "../../data/ColumnData";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import { StoreState } from "../StoreState";

import SpreadsheetView from "../SpreadsheetView.vue";

@Component({
    components: {
        SpreadsheetView,
    },
})
export default class ReviewRecords extends Mixin(StoreState, AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.reviewRecords;

    get columns() {
        return this.state.recordData.columns;
    }

    get cookedDataWithHeader() {
        return ColumnData.TransposeIntoCookedValueRowArray(this.columns, true);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.wizard-panel-content {
    display: flex;
    flex-direction: column;

    flex-grow: 1;

    padding: 0;
}

.desc-text {
    padding: 1rem 2rem;

    flex-grow: 0;
    flex-shrink: 0;
}

.spreadsheet {
    background: #fff;

    flex-grow: 1;
    flex-shrink: 0;

    position: relative;
}

.spreadsheet .viewer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.change-column {
    background: #3a7dda;
    padding: 0.3em 0.6em;

    color: #fff;
    font-size: 0.8em;
}

.change-column:hover,
.change-column:focus,
.change-column:active {
    background: #175ab7;
}
</style>
