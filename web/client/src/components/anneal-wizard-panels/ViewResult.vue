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
                                         :annealResultTreeNodeArray="annealResultTreeNodeArray"
                                         :columnData="columns"></SpreadsheetTreeView>
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
import { Component, Mixin, Lifecycle } from "av-ts";

import { unparseFile } from "../../data/CSV";
import { ColumnData } from "../../data/ColumnData";
import { ResultTree, AnnealOutput } from "../../data/ResultTree";
import { State, Data as IState } from "../../data/State";
import { AnnealRequest, AxiosResponse, AxiosError } from "../../data/AnnealRequest";
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

    private isRequestInProgress: boolean = false;
    private isAnnealSuccessful: boolean = false;

    get state() {
        return this.$store.state as IState;
    }

    get columns() {
        return this.state.recordData.columns;
    }

    onExportButtonClick() {
        // Get the columns and transform them back into 2D string array for
        // exporting
        const rows = ColumnData.TransposeIntoRawValueRowArray(this.columns, true);

        // Export as CSV
        const sourceFileName = this.state.recordData.source.name;
        unparseFile(rows, `${sourceFileName}.teamanneal.csv`);
    }

    get isExportButtonDisabled() {
        return this.isRequestInProgress;
    }

    get annealErrorMessage() {
        const request = this.state.annealRequest;

        // No request or no error
        if (request === undefined || AnnealRequest.IsRequestSuccessful(request)) {
            return undefined;
        }

        // Response here is now the error
        const error = AnnealRequest.GetResponse(request) as AxiosError;

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

    get annealResultTreeNodeArray() {
        const response = AnnealRequest.GetResponse(this.state.annealRequest!)! as AxiosResponse;
        const responseData = response.data.output as AnnealOutput;

        // Collapse all partitions back together as one large array
        //
        // NOTE: Currently this does not rearrange nodes such that partitions
        // are properly dealt with for naming purposes - currently all names
        // are global (see "client/data/Stratum.ts") so we can do this for now
        //
        // TODO: Support handling partitions so that they can be used properly
        // for naming contexts
        const resultArray = responseData.reduce((c, x) => [...c, ...x], []);

        // Generate nodes
        const nodes = ResultTree.InitNodesFromResultArray(this.state, resultArray);

        return nodes;
    }

    @Lifecycle created() {
        // Update with state information on creation
        this.isRequestInProgress = State.IsAnnealRequestInProgress(this.state);
        this.isAnnealSuccessful = State.IsAnnealSuccessful(this.state);

        // Get anneal request object
        const annealRequest = this.state.annealRequest;
        if (annealRequest === undefined) {
            // No anneal request was generated beforehand at this point, so
            // we can't listen to it
            console.log("Anneal request object not found; not listening for request completion");
            return;
        }

        // Need to listen to the anneal request object
        AnnealRequest.WaitForCompletion(annealRequest)
            .then(() => {
                // Update again
                this.isRequestInProgress = State.IsAnnealRequestInProgress(this.state);
                this.isAnnealSuccessful = State.IsAnnealSuccessful(this.state);
            });
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
