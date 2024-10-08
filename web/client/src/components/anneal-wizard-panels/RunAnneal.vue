<template>
    <div class="wizard-panel">
        <!-- Anneal not yet started -->
        <template v-if="annealIsNotRunning">

            <!-- Anneal can be executed -->
            <template v-if="annealCanBeExecuted">
                <div class="wizard-panel-content">
                    <h1>Ready to anneal</h1>
                    <p>TeamAnneal is ready to perform an anneal to form groups using your configured constraints.</p>
                    <p>Click "Start anneal" to begin.</p>
                </div>
                <div class="wizard-panel-bottom-buttons">
                    <button class="button"
                            @click="onStartAnnealButtonClick">Start anneal</button>
                </div>
            </template>

            <!-- Anneal cannot be executed (because of issues) -->
            <template v-else>
                <div class="wizard-panel-content">
                    <h1>Issues detected</h1>
                    <p>TeamAnneal has detected issues with your anneal configuration. Please correct these issues by returning to steps in the wizard where issues have been identified.</p>
                </div>
                <div class="wizard-panel-bottom-buttons">
                    <button class="button"
                            :disabled="true">Start anneal</button>
                </div>
            </template>
        </template>

        <!-- Anneal in progress -->
        <template v-if="annealIsInProgress">
            <div class="wizard-panel-content">
                <h1>Annealing...</h1>
                <p>Please wait while TeamAnneal forms groups...</p>
                <p>This may take a minute or two.</p>
                <p v-if="progressInfo === undefined || progressInfo.completedPartitions.length === 0">
                    <!-- Indeterminate progress, or no partitions completed yet -->
                    <progress class="anneal-progress"></progress>
                </p>
                <p v-else>
                    <!-- Actually visible progress -->
                    <progress class="anneal-progress"
                              :value="progressInfo.completedPartitions.length"
                              :max="progressInfo.expectedNumberOfResults">{{ progressInfo.completedPartitions.length }}/{{ progressInfo.expectedNumberOfResults }}</progress>
                </p>
            </div>
        </template>

        <!-- Anneal response is success -->
        <template v-if="annealResponseIsSuccess">
            <div class="wizard-panel-content">
                <h1>Anneal successful</h1>
                <p>To view your results, click "View results".</p>
                <p>If you would like to perform another anneal, click "Retry anneal".</p>
            </div>
            <div class="wizard-panel-bottom-buttons">
                <button class="button"
                        @click="onViewResultsButtonClick">View results</button>
                <button class="button secondary"
                        @click="onRetryAnnealButtonClick">Retry anneal</button>
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

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";
import * as AnnealRequestState from "../../data/AnnealRequestState";
import * as AnnealResponse from "../../data/AnnealResponse";
import * as AnnealRequest from "../../data/AnnealRequest";
import { AnnealTicketResponse } from "../../data/AnnealTicketResponse";

import { AnnealCreator as S, ResultsEditor } from "../../store";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class RunAnneal extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.runAnneal;

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

        // Cancelled anneals don't have error messages
        if (AnnealResponse.isCancelled(response)) {
            return undefined;
        }

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
        const error = response;

        // Error was returned from server
        if (error !== undefined) {
            const message =
                `${error}

HTTP ${error}`;

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

        // Some error with a message;
        if (error !== undefined) {
            return `Error: ${error}`;
        }

        // Unknown error
        return "Error: Unknown error occurred";
    }

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

    get progressInfo() {
        const annealRequestState = this.annealRequestState;

        if (!AnnealRequestState.isInProgress(annealRequestState)) {
            return undefined;
        }

        return annealRequestState.data.progressInfo;
    }
    
    get annealCanBeExecuted() {
        return S.get(S.getter.IS_ANNEAL_ABLE_TO_BE_EXECUTED);
    }

    async onStartAnnealButtonClick() {
        // Start request and store a copy of it internally in this component
        const annealRequest = AnnealRequest.generateRequestFromState(S.state);

        // Update state to "in-progress" now
        await S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_IN_PROGRESS, {});

        // Get ticket that is returned from server from the job initiation 
        // request
        //
        // TODO: Split ticket response processing in `AnnealResponse`
        const ticketResponse = AnnealResponse.processRawResponse(await AnnealRequest.waitForCompletion(annealRequest));

        if (!AnnealResponse.isSuccess(ticketResponse)) {
            // TODO: `any` currently overriding the anneal response type for ticket response
            S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_COMPLETED, ticketResponse as any);

            return;
        }

        // TODO: `any` currently overriding the anneal response type for ticket response
        const ticketResponseData: AnnealTicketResponse | undefined = ticketResponse.data as any;

        if (ticketResponseData === undefined) {
            throw new Error("No data in ticket response");
        }

        const ticketId = ticketResponseData.id;

        // Query the server for the result of the anneal
        const rawResponse = await AnnealRequest.queryAndUpdateAnnealStatus(
            ticketId,
            async (progressInfo) => {
                // Update state store with latest in-progress status
                await S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_IN_PROGRESS, {
                    progressInfo,
                });
            }
        );

        const response = AnnealResponse.processRawResponse(rawResponse);

        if (!AnnealResponse.isSuccess(response)) {
            S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_COMPLETED, response);
            return;
        }

        // Update state to "completed" with response
        S.dispatch(S.action.SET_ANNEAL_REQUEST_STATE_TO_COMPLETED, response);

    }

    async onViewResultsButtonClick() {
        // Export first
        const annealCreatorState = await S.dispatch(S.action.DEHYDRATE, {});

        // Import to ResultsEditor
        await ResultsEditor.dispatch(ResultsEditor.action.HYDRATE_FROM_ANNEAL_CREATOR_STATE, annealCreatorState);

        // Move to ResultsEditor
        this.$router.push({
            name: "wizard-results-editor",
        });
    }

    onRetryAnnealButtonClick() {
        // Start the anneal again
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
