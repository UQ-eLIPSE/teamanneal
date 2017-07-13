<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <div class="desc-text">
                <h1>Double check data</h1>
                <p>
                    Take a moment to make sure column data types and all records are correct.
                    <a class="more"
                       href="#">Need help?</a>
                </p>
                <div class="column-data-type-editor"></div>
            </div>
            <div class="spreadsheet">
                <SpreadsheetView class="viewer"
                                 :rows="cookedDataWithHeader"
                                 :columnInfo="columnInfo"></SpreadsheetView>
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

import * as SourceFile from "../../data/SourceFile";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import SpreadsheetView from "../SpreadsheetView.vue";

@Component({
    components: {
        SpreadsheetView,
    },
})
export default class ReviewRecords extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.reviewRecords;

    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    get columnInfo() {
        return this.fileInStore.columnInfo;
    }

    get cookedDataWithHeader() {
        const columnInfo = this.columnInfo;
        const cookedData = this.fileInStore.cookedData;

        if (columnInfo === undefined || cookedData === undefined) {
            return [];
        }

        return [columnInfo.map(x => x.label), ...cookedData];
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
