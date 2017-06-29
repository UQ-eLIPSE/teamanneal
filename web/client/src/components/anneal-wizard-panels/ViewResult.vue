<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>View result</h1>
    
            <p v-if="isRequestInProgress"
               style="color: #fff; background: darkred; padding: 0.5em;">
                Request in progress... (see console)
            </p>
            <div v-if="rootNodeAvailable">
                <ResultArrayNodeView v-for="childNode in rootNodeChildren"
                                     :node="childNode"></ResultArrayNodeView>
            </div>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button export-button"
                    @click="onExportButtonClick"
                    :disabled="isExportButtonDisabled">Export as CSV</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";
import * as Papa from "papaparse";
import * as FileSaver from "file-saver";

import * as Stratum from "../../data/Stratum";
import * as AnnealAjax from "../../data/AnnealAjax";
import * as TeamAnnealState from "../../data/TeamAnnealState";

import ResultArrayNodeView from "../ResultArrayNodeView.vue";

@Component({
    components: {
        ResultArrayNodeView,
    }
})
export default class ViewResult extends Vue {
    onExportButtonClick() {
        const exportCsvRows: ReadonlyArray<string | number>[] = [];

        // Use raw data and append the strata columns to the end of them as necessary
        const rawData = this.sourceFileRawData;
        const strata = this.strata;
        const outputIdNodeMap = this.outputIdNodeMap;
        const idColumnIndex = this.idColumnIndex;

        rawData.forEach((originalRow, rowIndex) => {
            // Row must be copied otherwise we're mutating the stored raw data
            const row = originalRow.slice();

            if (rowIndex === 0) {
                // If row is header row, just add the stratum label as part of
                // column headings
                strata.forEach((stratum) => {
                    row.push(stratum.label);
                });
            } else {
                // If normal data row, use the row -> hierarchy map to get label
                const key = '' + originalRow[idColumnIndex];

                const hierarchy = outputIdNodeMap.get(key);

                if (hierarchy === undefined) {
                    throw new Error(`Could not find node hierarchy for record ID ${key}`);
                }

                hierarchy.forEach((node) => {
                    row.push(node.counterValue!);
                });
            }

            // Add new row into export array
            exportCsvRows.push(row);
        });

        const csvString = Papa.unparse(exportCsvRows);

        const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8" })
        FileSaver.saveAs(csvBlob, `${this.sourceFileName}.teamanneal.csv`, true);
    }

    get isExportButtonDisabled() {
        return this.isRequestInProgress;
    }

    get isRequestInProgress() {
        return TeamAnnealState.isAnnealRequestInProgress(this.$store.state);
    }

    get rootNodeAvailable() {
        return this.$store.state.anneal.outputTree && this.$store.state.anneal.outputTree.children.length > 0;
    }

    get rootNodeChildren() {
        return this.$store.state.anneal.outputTree.children;
    }

    get outputIdNodeMap() {
        return this.$store.state.anneal.outputIdNodeMap as Map<string, ReadonlyArray<AnnealAjax.ResultArrayNode>>;
    }

    get sourceFileRawData() {
        return this.$store.state.sourceFile.rawData as ReadonlyArray<ReadonlyArray<string | number>>;
    }

    get sourceFileName() {
        return this.$store.state.sourceFile.name as string;
    }

    get strata() {
        return this.$store.state.constraintsConfig.strata as ReadonlyArray<Stratum.Stratum>;
    }

    get idColumnIndex() {
        return this.$store.state.constraintsConfig.idColumnIndex as number;
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

.export-button {
    background: darkgreen;
}
</style>
