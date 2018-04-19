<template>
    <div class="wizard-panel">
        <!-- Anneal not yet started -->
        <template v-if="annealIsNotRunning">
            <div class="wizard-panel-content">
                <h1>Ready to anneal</h1>
                <p>[Message]</p>
            </div>
            <div class="wizard-panel-bottom-buttons">
                <button class="button"
                        @click="onStartAnnealButtonClick">Start anneal</button>
            </div>
        </template>

        <!-- Anneal in progress -->
        <template v-if="annealIsInProgress">
            <div class="wizard-panel-content">
                <h1>Annealing...</h1>
            </div>
            <div class="wizard-panel-bottom-buttons">
                <button class="button secondary"
                        @click="onCancelAnnealButtonClick">Cancel anneal</button>
            </div>
        </template>

        <!-- Anneal response is success -->
        <template v-if="annealResponseIsSuccess">
            <div class="wizard-panel-content">
                <h1>Anneal successful</h1>
                <p>[Message]</p>
            </div>
            <div class="wizard-panel-bottom-buttons">
                <button class="button"
                        @click="onViewResultsButtonClick">View results</button>
            </div>
        </template>

        <!-- Anneal response is an error -->
        <template v-if="annealResponseIsError">
            <div class="wizard-panel-content">
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
                <p>Once you have adjusted the anneal configuration, click "Retry anneal".</p>
                <p>If you continue to encounter issues,
                    <a href="https://www.elipse.uq.edu.au/"
                       target="_blank">contact eLIPSE</a>.</p>
            </div>
            <div class="wizard-panel-bottom-buttons">
                <button class="button secondary"
                        @click="onRetryAnnealButtonClick">Retry anneal</button>
            </div>
        </template>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

// import * as ToClientAnnealResponse from "../../../../common/ToClientAnnealResponse";
// import * as AnnealNode from "../../../../common/AnnealNode";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";
// import { ColumnData } from "../../data/ColumnData";
// import { ResultTree } from "../../data/ResultTree";
// import { State } from "../../data/State";
// import { Stratum } from "../../data/Stratum";
// import { AnnealResponse, AxiosResponse, AxiosError } from "../../data/AnnealResponse";
// import { GroupNode } from "../../data/GroupNode";
// import { GroupNodeRoot } from "../../data/GroupNodeRoot";
// import { GroupNodeIntermediateStratum } from "../../data/GroupNodeIntermediateStratum";
// import { GroupNodeLeafStratum } from "../../data/GroupNodeLeafStratum";
// import { GroupNodeNameMap } from "../../data/GroupNodeNameMap";
// import { GroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";
import * as AnnealRequestState from "../../data/AnnealRequestState";
import * as AnnealResponse from "../../data/AnnealResponse";
import * as AnnealRequest from "../../data/AnnealRequest";

import { AnnealCreator as S } from "../../store";

// import { unparseFile } from "../../util/CSV";
// import { replaceAll } from "../../util/String";
// import { deepCopy } from "../../util/Object";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class RunAnneal extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.runAnneal;

    /** Holds an ongoing anneal request if running */
    p_annealRequest: AnnealRequest.AnnealRequest | undefined = undefined;

    // async onEditResultButtonClick() {
    //     // TODO: This state data copying process will need to be reviewed when
    //     // state (de)hydration is properly implemented; currently this just does
    //     // a straight copy which is not optimal

    //     // TODO: Not everything is being copied at the moment


    //     // Copy over record data
    //     const recordData = S.state.recordData;
    //     // TODO: Use a better, more structured copy than a straight JSON copy
    //     const recordDataCopy = deepCopy(recordData);
    //     await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.SET_RECORD_DATA, recordDataCopy);

    //     // Copy over strata
    //     const strata = this.strata;
    //     // TODO: Use a better, more structured copy than a straight JSON copy
    //     const strataCopy = deepCopy(strata);
    //     await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.SET_STRATA, strataCopy);

    //     // Copy over group nodes
    //     //
    //     // This is a lot more involved because the old state and module state
    //     // use different representations, and names are now stored in a concrete
    //     // object rather than generated on-the-fly

    //     // Walk the tree and decompose data
    //     const nameMap = this.nameMap;
    //     const newRoots: GroupNodeRoot[] = [];
    //     const newNameMap: GroupNodeNameMap = {};
    //     const newNodeRecordArrayMap: GroupNodeRecordArrayMap = {};

    //     const walkAnnealTreeAndTransform = (node: AnnealNode.Node): GroupNode => {
    //         const nodeId = node._id;
    //         const nameInfo = nameMap.get(node)!;

    //         switch (node.type) {
    //             case "root": {
    //                 const newRoot: GroupNodeRoot = {
    //                     _id: nodeId,
    //                     type: "root",
    //                     children: node.children.map(walkAnnealTreeAndTransform) as (GroupNodeIntermediateStratum | GroupNodeLeafStratum)[],
    //                 };

    //                 // Push root, name
    //                 newRoots.push(newRoot);
    //                 newNameMap[nodeId] = `${nameInfo.stratumLabel} ${nameInfo.nodeGeneratedName}`;

    //                 return newRoot;
    //             }

    //             case "stratum-stratum": {
    //                 const newIntStrNode: GroupNodeIntermediateStratum = {
    //                     _id: nodeId,
    //                     type: "intermediate-stratum",
    //                     children: node.children.map(walkAnnealTreeAndTransform) as (GroupNodeIntermediateStratum | GroupNodeLeafStratum)[],
    //                 };

    //                 // Push name
    //                 newNameMap[nodeId] = `${nameInfo.stratumLabel} ${nameInfo.nodeGeneratedName}`;

    //                 return newIntStrNode;
    //             }

    //             case "stratum-records": {
    //                 const newLeafStrNode: GroupNodeLeafStratum = {
    //                     _id: nodeId,
    //                     type: "leaf-stratum",
    //                 };

    //                 // Push name, records
    //                 newNameMap[nodeId] = `${nameInfo.stratumLabel} ${nameInfo.nodeGeneratedName}`;
    //                 newNodeRecordArrayMap[nodeId] = [...node.recordIds];

    //                 return newLeafStrNode;
    //             }
    //         }
    //     }

    //     this.annealNodeRoots.forEach(walkAnnealTreeAndTransform);

    //     await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.SET_GROUP_NODE_STRUCTURE, { roots: newRoots });
    //     await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.SET_GROUP_NODE_NAME_MAP, newNameMap);
    //     await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.SET_GROUP_NODE_RECORD_ARRAY_MAP, newNodeRecordArrayMap);

    //     // Go to results editor
    //     this.$router.push({
    //         name: "results-editor",
    //     });
    // }

    get annealRequestState() {
        return S.state.annealRequest;
    }

    get annealErrorMessage() {
        const annealRequestState = this.annealRequestState;

        // If the request is not yet completed or there is no request, no error
        // message should be shown
        if (!AnnealRequestState.isCompleted(annealRequestState)) {
            return undefined;
        }

        const response = annealRequestState.response;

        // No request/response error
        // NOTE: This is not the same as "no anneal error"!
        if (AnnealResponse.isSuccess(response)) {
            const responseData = response.data;

            if (responseData === undefined) {
                return `Error: No data was returned in server response`;
            }

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
        const error = response.error as AnnealResponse.AxiosError;

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

    // get annealResults() {
    //     const responseContent = this.state.annealResponse!.content as AxiosResponse;
    //     const responseData = responseContent.data as ToClientAnnealResponse.Root;

    //     // We're working on the presumption that we definitely have results
    //     return responseData.results!;
    // }

    // get annealNodeRoots() {
    //     return this.annealResults.map(res => res.result!.tree);
    // }

    // get annealSatisfactionMap() {
    //     return this.annealResults
    //         .map(res => res.result!.satisfaction)
    //         .reduce((carry, sMap) => Object.assign(carry, sMap), {});
    // }

    // get combinedNameFormat() {
    //     let combinedNameFormat = S.state.nodeNamingConfig.combined.format;

    //     if (combinedNameFormat === undefined) {
    //         return undefined;
    //     }

    //     return combinedNameFormat;
    // }

    get annealIsNotRunning() {
        return AnnealRequestState.isNotRunning(this.annealRequestState);
    }

    get annealIsInProgress() {
        return AnnealRequestState.isInProgress(this.annealRequestState);
    }

    get annealResponseIsSuccess() {
        const annealRequestState = this.annealRequestState;

        return (
            AnnealRequestState.isCompleted(annealRequestState) &&
            this.annealErrorMessage === undefined
        );
    }

    get annealResponseIsError() {
        const annealRequestState = this.annealRequestState;

        return (
            AnnealRequestState.isCompleted(annealRequestState) &&
            this.annealErrorMessage !== undefined
        );
    }

    async onStartAnnealButtonClick() {
        // Start request and store a copy of it internally in this component
        const annealRequest = AnnealRequest.generateRequestFromState(S.state);
        this.p_annealRequest = annealRequest;

        // Update state to "in-progress" now
        await S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_IN_PROGRESS, undefined);

        // Once request completes, we update the state with a processed response
        AnnealRequest.waitForCompletion(annealRequest)
            .then((response) => {
                const processedResponse = AnnealResponse.processRawResponse(response);

                // Update state to "completed" with response
                S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_COMPLETED, processedResponse);
            });
    }

    async onCancelAnnealButtonClick() {
        // Cancel anneal immediately
        const annealRequest = this.p_annealRequest;

        if (annealRequest === undefined) {
            return;
        }

        AnnealRequest.cancel(annealRequest);

        // Update state to "not-running"
        await S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_NOT_RUNNING, undefined);
    }

    onViewResultsButtonClick() {
        // Transfer to editor
    }

    onRetryAnnealButtonClick() {
        // Just start again
        this.onStartAnnealButtonClick();
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.desc-text {
    padding: 1rem 2rem;

    flex-grow: 0;
    flex-shrink: 0;
}

.anneal-error {
    background: #ddd;
    border: 1px dashed #a00;
    padding: 1em;
    overflow: auto;
}
</style>
