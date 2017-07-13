<template>
    <div class="wizard-panel">
        <template v-if="isRequestInProgress">
            <div class="wizard-panel-content">
                <div class="desc-text">
                    <h1>Anneal in progress</h1>
                    <p>Please wait while TeamAnneal forms groups...</p>
                    <p>This may take a minute or two.</p>
                </div>
            </div>
        </template>
        <template v-else-if="isAnnealSuccessful">
            <div class="wizard-panel-content">
                <div class="desc-text">
                    <h1>View result</h1>
                    <p>Annealed groups are shown below. To save this output as a file, click "Export as CSV".
                        <a class="more"
                           href="#">Need help?</a>
                    </p>
                </div>
                <div v-if="rootNodeAvailable"
                     class="spreadsheet">
                    <SpreadsheetTreeView class="viewer"
                                         :tree="rootNode"
                                         :columnInfo="columnInfo"></SpreadsheetTreeView>
                </div>
            </div>
            <div v-if="rootNodeAvailable"
                 class="wizard-panel-bottom-buttons">
                <button class="button export-button"
                        @click="onExportButtonClick"
                        :disabled="isExportButtonDisabled">Export as CSV</button>
            </div>
        </template>
        <template v-else>
            <div class="wizard-panel-content">
                <div class="desc-text">
                    <h1>Anneal failed</h1>
                    <pre class="anneal-error">{{ annealErrorMessage }}</pre>
                    <h2>Things you can try to resolve issues</h2>
                    <ul>
                        <li>Check that source data, group configuration and constraints make sense</li>
                        <ul>
                            <li>
                                <i>For example, configuring a group with size 20 when you only have 15 people in total is not valid, as there are no possible ways to reorganise your group</i>
                            </li>
                        </ul>
                        <li>Add or remove constraints so that TeamAnneal can arrange groups in a convergent manner</li>
                        <li>If the error relates to the network request, check that you have an active network connection and try again</li>
                    </ul>
                    <p>If you continue to encounter issues,
                        <a href="https://www.elipse.uq.edu.au/"
                           target="_blank">contact eLIPSE</a>.</p>
                </div>
            </div>
        </template>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";
import * as Papa from "papaparse";
import * as FileSaver from "file-saver";

import * as TeamAnnealState from "../../data/TeamAnnealState";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import SpreadsheetTreeView from "../SpreadsheetTreeView.vue";

@Component({
    components: {
        SpreadsheetTreeView,
    }
})
export default class ViewResult extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.viewResult;

    onExportButtonClick() {
        const exportCsvRows: ReadonlyArray<string | number>[] = [];

        // Use raw data and append the strata columns to the end of them as necessary
        const rawData = this.sourceFileRawData!;
        const strata = this.strata!;
        const outputIdNodeMap = this.outputIdNodeMap!;
        const idColumnIndex = this.idColumnIndex!;

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

    get state() {
        return this.$store.state as TeamAnnealState.TeamAnnealState;
    }

    get isExportButtonDisabled() {
        return this.isRequestInProgress;
    }

    get isRequestInProgress() {
        return TeamAnnealState.isAnnealRequestInProgress(this.state);
    }

    get isAnnealSuccessful() {
        return TeamAnnealState.isAnnealSuccessful(this.state);
    }

    get annealError() {
        return this.state.anneal.outputError;
    }

    get annealErrorMessage() {
        const error = this.annealError;

        // No error 
        if (error === undefined) {
            return undefined;
        }

        // Error was returned from server
        const errResponse = error.response;
        if (errResponse !== undefined) {
            const message =
                `${errResponse.data.error}

HTTP ${errResponse.status}`;

            return message;
        }

        // Error happened in XHR process
        const errXHR: XMLHttpRequest | undefined = (error as any).request;
        if (errXHR !== undefined) {
            const message =
                `Error: Network request failed

XMLHttpRequest {
  readyState: ${errXHR.readyState}
  status: ${errXHR.status}
  timeout: ${errXHR.timeout}
}`;
            return message;
        }

        // Some error with a message
        const errMsg = error.message;
        if (errMsg !== undefined) {
            return `Error: ${errMsg}`;
        }

        // Unknown error
        return "Error: Unknown error occurred";
    }

    get rootNodeAvailable() {
        return this.state.anneal.outputTree && this.state.anneal.outputTree.children!.length > 0;
    }

    get rootNode() {
        return this.state.anneal.outputTree;
    }

    get rootNodeChildren() {
        return this.rootNode!.children;
    }

    get fileInStore() {
        return this.state.sourceFile;
    }

    get columnInfo() {
        return this.fileInStore.columnInfo;
    }

    get outputIdNodeMap() {
        return this.state.anneal.outputIdNodeMap;
    }

    get sourceFileRawData() {
        return this.state.sourceFile.rawData;
    }

    get sourceFileName() {
        return this.state.sourceFile.name;
    }

    get strata() {
        return this.state.constraintsConfig.strata;
    }

    get idColumnIndex() {
        return this.state.constraintsConfig.idColumnIndex;
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

.wizard-panel-content h2 {
    color: #49075E;
    font-weight: 400;
    font-size: 1.9em;
    margin: 0.5rem 0;
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

.export-button {
    background: darkgreen;
}

.anneal-error {
    background: #ccc;
    border: 1px dashed #a00;
    padding: 1em;
    overflow: auto;
}
</style>
