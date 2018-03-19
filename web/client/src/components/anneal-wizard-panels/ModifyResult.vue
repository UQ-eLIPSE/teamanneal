<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <div class="desc-text">
                <h1>Modify result</h1>
            </div>
            <div class="workspace">
                <div class="edit-operations">
                    <ModifyResultEditOperationBar :pendingEditOperation="pendingEditOperation"
                                                  @selectOperation="onSelectEditOperation"
                                                  @cancelOperation="onCancelEditOperation"
                                                  @commitOperation="onCommitEditOperation"
                                                  @cursorChange="onEditOperationCursorChange"></ModifyResultEditOperationBar>

                </div>
                <div class="spreadsheet-dashboard-wrapper">
                    <div class="spreadsheet">
                        <SpreadsheetTreeView2 class="viewer"
                                              :annealNodeRoots="modifiedAnnealNodeRoots"
                                              :headerRow="headerRow"
                                              :recordRows="recordRows"
                                              :idColumnIndex="idColumnIndex"
                                              @itemClick="onItemClickHandler">
                        </SpreadsheetTreeView2>
                    </div>
                    <div class="dashboard">
                        Dashboard
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Lifecycle, Mixin } from "av-ts";

import * as ToClientAnnealResponse from "../../../../common/ToClientAnnealResponse";

import { ColumnData } from "../../data/ColumnData";
import { ResultTree } from "../../data/ResultTree";
import { State } from "../../data/State";
import { AnnealResponse, AxiosResponse, AxiosError } from "../../data/AnnealResponse";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { StoreState } from "../StoreState";

import { RecordElement } from "../../../../common/Record";
import * as AnnealNode from "../../../../common/AnnealNode";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import SpreadsheetTreeView2 from "../SpreadsheetTreeView2.vue";
import ModifyResultEditOperationBar from "../ModifyResultEditOperationBar.vue";

type EditOperation = EditOperation_MoveRecord;

interface EditOperation_MoveRecord {
    type: "move-record",
    cursor: keyof EditOperation_MoveRecord | undefined,
    from: { path: ReadonlyArray<AnnealNode.Node>, recordId: RecordElement, } | undefined,
    to: { path: ReadonlyArray<AnnealNode.Node>, } | undefined,
}

@Component({
    components: {
        SpreadsheetTreeView2,
        ModifyResultEditOperationBar
    },
})
export default class ModifyResult extends Mixin(StoreState, AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.viewResult;

    /**
     * Holds a new deep copy of the annealed nodes that may be modified by the 
     * user
     */
    modifiedAnnealNodeRoots: AnnealNode.NodeRoot[] | undefined = undefined;

    /** Stores the current editing operation information */
    pendingEditOperation: EditOperation | undefined = undefined;

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
        if (this.modifiedAnnealNodeRoots === undefined) {
            return undefined;
        }

        return ResultTree.GenerateNodeNameMap(this.strata, this.partitionColumn, this.modifiedAnnealNodeRoots);
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

    get annealResults() {
        const responseContent = this.state.annealResponse!.content as AxiosResponse;
        const responseData = responseContent.data as ToClientAnnealResponse.Root;

        // We're working on the presumption that we definitely have results
        return responseData.results!;
    }

    get annealSatisfactionMap() {
        return this.annealResults
            .map(res => res.result!.satisfaction)
            .reduce((carry, sMap) => Object.assign(carry, sMap), {});
    }

    get combinedNameFormat() {
        let combinedNameFormat = this.state.annealConfig.namingConfig.combined.format;

        if (combinedNameFormat === undefined) {
            return undefined;
        }

        return combinedNameFormat;
    }

    onItemClickHandler(data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) {
        // Only continue if we're in an editing operation
        if (this.pendingEditOperation === undefined) {
            return;
        }

        // Each operation type has different behaviours
        const op = this.pendingEditOperation;

        switch (op.type) {
            case "move-record": {
                switch (op.cursor) {
                    case "from": {
                        // TODO: Fix type narrowing
                        const targetItem: any = data[data.length - 1];

                        // Can only move records
                        if (targetItem.recordId === undefined) {
                            return;
                        }

                        // Split array, with the assumption that record only
                        // appears at end once
                        const recordId: RecordElement = targetItem.recordId;
                        const targetPath = (data.slice(0, -1) as { node: AnnealNode.Node }[]).map(item => item.node);

                        // Set operation path and cursor
                        op.from = {
                            path: targetPath,
                            recordId,
                        };

                        // Move cursor to "to" if `to` not filled in
                        if (op.to === undefined) {
                            op.cursor = "to";
                        } else {
                            op.cursor = undefined;
                        }

                        return;
                    }

                    case "to": {
                        // Get the lowest stratum selected
                        const targetNodeReversedIndex = [...data].reverse().findIndex((item: any) => item.node !== undefined);
                        const arrayCopyLength = (targetNodeReversedIndex === -1) ? data.length : data.length - targetNodeReversedIndex;
                        // TODO: Fix type narrowing
                        const targetPath = (data.slice(0, arrayCopyLength) as { node: AnnealNode.Node }[]).map(item => item.node);
                        const targetNode = targetPath[targetPath.length - 1];

                        // Can only move records to other "stratum-records"
                        if (targetNode.type !== "stratum-records") {
                            return;
                        }

                        // Set operation path and cursor
                        op.to = {
                            path: targetPath,
                        };

                        op.cursor = undefined;

                        return;
                    }
                }
                return;
            }
        }
    }

    onSelectEditOperation(operationType: string) {
        switch (operationType) {
            case "move-record": {
                this.pendingEditOperation = {
                    type: "move-record",
                    cursor: "from",
                    from: undefined,
                    to: undefined,
                }
                break;
            }
        }
    }

    onCancelEditOperation() {
        this.pendingEditOperation = undefined;
    }

    onCommitEditOperation() {
        // Perform the edit operation
        const op = this.pendingEditOperation;

        if (op === undefined) {
            return;
        }

        switch (op.type) {
            case "move-record": {
                // Invalid state for commit
                if (op.from === undefined || op.to === undefined) {
                    throw new Error("Not enough information provided for move operation");
                }

                const from = op.from;
                const fromPath = from.path;
                const fromNode = fromPath[fromPath.length - 1];

                const movedRecordId = from.recordId;

                if (fromNode.type !== "stratum-records") {
                    throw new Error("'From node' is not a record carrying stratum");
                }

                const to = op.to;
                const toPath = to.path;
                const toNode = toPath[toPath.length - 1];

                if (toNode.type !== "stratum-records") {
                    throw new Error("'To node' is not a record carrying stratum");
                }

                // TODO: Fix type `any`
                // This is due to nodes being typed as being purely read-only
                // for safety, but this prevents us from being able to modify 
                // the node information as required here, unless we do a full
                // recreation of the tree
                (fromNode as any).recordIds = fromNode.recordIds.filter(x => x !== movedRecordId);
                (toNode as any).recordIds = [...toNode.recordIds, movedRecordId];

                break;
            }
        }

        // Clear the pending edit operation now that we're done
        this.pendingEditOperation = undefined;
    }

    onEditOperationCursorChange(cursor: string | undefined) {
        if (this.pendingEditOperation === undefined) {
            return;
        }

        // TODO: Fix type narrowing
        this.pendingEditOperation.cursor = cursor as any;
    }

    @Lifecycle created() {
        // Copy out the data from the state so that modifications are separate 
        // from the anneal result which is consistent with constraints
        //
        // This is NOT persistent - if you leave this component, the changes you
        // made will disappear
        //
        // TODO: This needs some persistence of some sort but this will heavily
        // depend on how we will be managing the data
        this.modifiedAnnealNodeRoots = JSON.parse(JSON.stringify(this.annealResults.map(res => res.result!.tree)));
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

.workspace {
    flex-grow: 1;
    flex-shrink: 0;

    display: flex;
    flex-direction: column;
}

.edit-operations {
    background: #e6e6e6;
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    flex-shrink: 0;
    margin: 1rem 0 1rem 0;
}

.spreadsheet-dashboard-wrapper {
    flex-grow: 1;
    flex-shrink: 0;

    display: flex;
    flex-direction: row;
}

.spreadsheet {
    background: #fff;

    flex-grow: 100;
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

.dashboard {
    background: #e6e6e6;

    flex-grow: 1;
    flex-shrink: 1;

    min-width: 20vw;
    max-width: 30vw;
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
