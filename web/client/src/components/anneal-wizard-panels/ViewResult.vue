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
                        <a class="more help-link"
                           :class="{'active': showHelp}"
                           href="#"
                           @click.prevent="toggleHelp">Need help?</a>
                    </p>
                    <div class="help-box"
                         v-if="showHelp">
                        <h2>Results don't seem to fit constraints</h2>
                        <p>TeamAnneal uses a simulated annealing algorithm to form groups with consideration to constraints you provide. This process is random and can be affected by the constraints you configure.</p>
                        <p>If you are unsatisfied with the result, try adding, removing or adjusting your constraints before attempting another anneal.</p>
                        <p>If you still believe that the results are unreasonable or contain errors,
                            <a href="https://www.elipse.uq.edu.au/"
                               target="_blank">contact eLIPSE</a>.</p>
                    </div>
                </div>
                <div class="spreadsheet">
                    <SpreadsheetTreeView class="viewer"
                                         :annealNodeRoots="annealNodeRoots"
                                         :headerRow="headerRow"
                                         :recordRows="recordRows"
                                         :nameMap="nameMap"
                                         :idColumnIndex="idColumnIndex"
                                         :numberOfColumns="columns.length"
                                         :combinedNameFormat="combinedNameFormat"
                                         :hidePartitions="partitionColumn === undefined"></SpreadsheetTreeView>
                </div>
            </div>
            <div class="wizard-panel-bottom-buttons">
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

import * as ToClientAnnealResponse from "../../../../common/ToClientAnnealResponse";

import { unparseFile } from "../../data/CSV";
import { ColumnData } from "../../data/ColumnData";
import { ResultTree } from "../../data/ResultTree";
import { State } from "../../data/State";
import { AnnealResponse, AxiosResponse, AxiosError } from "../../data/AnnealResponse";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { replaceAll } from "../../util/String";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import { StoreState } from "../StoreState";
import SpreadsheetTreeView from "../SpreadsheetTreeView.vue";

@Component({
    components: {
        SpreadsheetTreeView,
    },
})
export default class ViewResult extends Mixin(StoreState, AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.viewResult;

    get columns() {
        return this.state.recordData.columns;
    }

    get strata() {
        return this.state.annealConfig.strata;
    }

    get partitionColumn() {
        const partitionColumnDesc = this.state.recordData.partitionColumn;

        if (partitionColumnDesc === undefined) {
            return undefined;
        }

        return ColumnData.ConvertToDataObject(this.columns, partitionColumnDesc);
    }

    get headerRow() {
        return this.columns.map(col => col.label);
    }

    get recordRows() {
        return ColumnData.TransposeIntoCookedValueRowArray(this.columns);
    }

    get nameMap() {
        return ResultTree.GenerateNodeNameMap(this.strata, this.partitionColumn, this.annealNodeRoots);
    }

    get idColumn() {
        const idColumnDesc = this.state.recordData.idColumn;

        if (idColumnDesc === undefined) {
            throw new Error("No ID column set");
        }

        const idColumn = this.columns.find(col => ColumnData.Equals(idColumnDesc, col));

        if (idColumn === undefined) {
            throw new Error("No ID column set");
        }

        return idColumn;
    }

    get idColumnIndex() {
        const idColumn = this.idColumn;
        const idColumnIndex = this.columns.indexOf(idColumn);

        return idColumnIndex;
    }

    onExportButtonClick() {
        // Get node name map
        const nodes = this.annealNodeRoots;
        const strata = this.state.annealConfig.strata;
        const nameMap = this.nameMap;

        // Convert into record node name map
        const recordNameMap = ResultTree.GenerateRecordNodeNameMap(nameMap, nodes);

        // Get the columns and transform them back into 2D string array for
        // exporting, and include the headers in the output while we're at it
        const rows = ColumnData.TransposeIntoRawValueRowArray(this.columns, true);

        // We use cooked values for the record ID columns for referencing
        const idColumnValues = ColumnData.GenerateCookedColumnValues(this.idColumn);

        const combinedNameFormat = this.combinedNameFormat;

        rows.forEach((row, i) => {
            // Add stratum labels to the header rows
            if (i === 0) {
                const headerRow = row;
                strata.forEach((stratum) => {
                    headerRow.push(stratum.label);
                });

                // Add one more column header for combined group names if 
                // they are present
                if (combinedNameFormat !== undefined) {
                    headerRow.push("Combined group name");
                }

                return;
            }

            // Append name values to end of ordinary row

            // Note that this is not the same as row[idColumnIndex] as the row
            // is always the raw value (string[]), while the record ID values in
            // the name map are cooked values
            const recordId = idColumnValues[i - 1]; // Remember that `i = 0` is the header row

            // Get name object array
            const name = recordNameMap.get(recordId);

            if (name === undefined) {
                throw new Error("Name for record node not found");
            }

            // For the purposes of CSV exports, we only want the generated name 
            // value and not the stratum label for each record
            //
            // The filter here removes partition info from the output as it'll
            // duplicate the existing partition column
            name
                .filter(nameObj => nameObj.stratumId !== "_PARTITION")
                .forEach((nameObj) => {
                    row.push("" + nameObj.nodeGeneratedName);
                });

            // Push in combined name as well
            if (combinedNameFormat !== undefined) {
                let combinedName = combinedNameFormat;
                name.forEach(({ stratumId, nodeGeneratedName }) => {
                    combinedName = replaceAll(combinedName, `{{${stratumId}}}`, "" + nodeGeneratedName);
                });

                row.push(combinedName);
            }
        });

        // Export as CSV
        const sourceFileName = this.state.recordData.source.name;
        unparseFile(rows, `${sourceFileName}.teamanneal.csv`);
    }

    get isExportButtonDisabled() {
        return this.isRequestInProgress;
    }

    get isRequestInProgress() {
        return State.IsAnnealRequestInProgress(this.state);
    }

    get isAnnealSuccessful() {
        // If the request is successful and there is no error message
        return (
            State.IsAnnealRequestSuccessful(this.state) &&
            this.annealErrorMessage === undefined
        );
    }

    get annealErrorMessage() {
        const response = this.state.annealResponse;

        // No response - can't say much at the moment
        if (response === undefined) {
            return undefined;
        }

        // No request/response error
        // NOTE: This is not the same as "no anneal error"!
        if (AnnealResponse.IsSuccessful(response)) {
            const responseContent = response.content;
            const responseData = responseContent.data as ToClientAnnealResponse.Root;

            // Return error now if it encompasses entire response
            if (responseData.error !== undefined) {
                return `Error: ${responseData.error}`;
            }


            // We still need to check if there was an error in one of the 
            // individual anneal node results
            if (responseData.results !== undefined) {
                const annealNodesWithErrors: { index: number, error: string }[] = [];

                // Accumulate errors if present
                responseData.results.forEach((result, index) => {
                    if (result.error !== undefined) {
                        annealNodesWithErrors.push({
                            index,
                            error: result.error,
                        });
                    }
                });

                // Return error if there is a node which suffered a failure
                if (annealNodesWithErrors.length > 0) {
                    let message = "Error: One or more nodes failed to anneal:\n";
                    annealNodesWithErrors.forEach(({ index, error, }) => {
                        message += `  at node index ${index}: \n     ${error}\n`;
                    });

                    return message;
                }
            }

            // No problems
            return undefined;
        }

        // Response here is now the error
        const error = response.content as AxiosError;

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

    get annealNodeRoots() {
        const responseContent = this.state.annealResponse!.content as AxiosResponse;
        const responseData = responseContent.data as ToClientAnnealResponse.Root;

        // We're working on the presumption that we definitely have results
        const results = responseData.results!;
        const annealNodeRoots = results.map(res => res.result!);

        return annealNodeRoots;
    }

    get combinedNameFormat() {
        let combinedNameFormat = this.state.annealConfig.namingConfig.combined.format;

        if (combinedNameFormat === undefined) {
            return undefined;
        }

        return combinedNameFormat;
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

.export-button {
    background: darkgreen;
}

.anneal-error {
    background: #ddd;
    border: 1px dashed #a00;
    padding: 1em;
    overflow: auto;
}
</style>
