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
                                 :columnInfo="columnInfo"
                                 @columnTypeChange="onColumnTypeChange"></SpreadsheetView>
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
import { Vue, Component } from "av-ts";

import * as SourceFile from "../../data/SourceFile";
import * as ColumnInfo from "../../data/ColumnInfo";
import * as CookedData from "../../data/CookedData";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import SpreadsheetView from "../SpreadsheetView.vue";

const thisWizardStep = AnnealProcessWizardEntries.reviewRecords;

@Component({
    components: {
        SpreadsheetView,
    },
})
export default class ReviewRecords extends Vue {
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

    onColumnTypeChange(data: any) {
        const oldColumnInfo: ColumnInfo.ColumnInfo = data.columnInfo;
        const newColumnType: string = data.newColumnType;

        const colIndex = oldColumnInfo.index;
        const colLabel = oldColumnInfo.label;
        const rawData = this.fileInStore.rawData!;

        // Get the column values again and generate new column info objects
        const valueSet = ColumnInfo.extractColumnValues(rawData, colIndex, true);

        let newColumnInfo: ColumnInfo.ColumnInfo;
        switch (newColumnType) {
            case "number": {
                newColumnInfo = ColumnInfo.createColumnInfoNumber(colLabel, colIndex, valueSet as Set<number>);
                break;
            }

            case "string": {
                newColumnInfo = ColumnInfo.createColumnInfoString(colLabel, colIndex, valueSet as Set<string>);
                break;
            }

            default:
                throw new Error("Unknown column type");
        }

        // Update store column info
        const columnInfoReplaceUpdate: ColumnInfo.ReplaceUpdate = { oldColumnInfo, newColumnInfo, };
        this.$store.commit("replaceSourceFileColumnInfo", columnInfoReplaceUpdate);

        // Recook the data with new columns in the store
        const columnInfoArray = this.columnInfo!;
        const cookedData = CookedData.cook(columnInfoArray, rawData, true);

        // Serve freshly cooked data to the stale store
        this.$store.commit("updateSourceFileCookedData", cookedData);
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
