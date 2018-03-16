<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <div class="desc-text">
                <h1>Modify result</h1>
            </div>
            <div class="workspace">
                <div class="edit-operations">
                    <br> Edit operations
                    <br>
                </div>
                <div class="spreadsheet-dashboard-wrapper">
                    <div class="spreadsheet">
                        <SpreadsheetTreeView2 class="viewer"
                                              :annealNodeRoots="annealNodeRoots"
                                              :constraintSatisfactionMap="nodeToOverallSatisfactionMap"
                                              :headerRow="headerRow"
                                              :recordRows="recordRows"
                                              :idColumnIndex="idColumnIndex"></SpreadsheetTreeView2>
                    </div>
                    <div class="dashboard">
                        <ConstraintSatisfactionDashboard2 class="constraint-satisfaction"
                                                          :constraintSatisfactionMap="annealSatisfactionMap"></ConstraintSatisfactionDashboard2>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import * as ToClientAnnealResponse from "../../../../common/ToClientAnnealResponse";

import { ColumnData } from "../../data/ColumnData";
import { ResultTree } from "../../data/ResultTree";
import { AxiosResponse } from "../../data/AnnealResponse";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import { StoreState } from "../StoreState";

import SpreadsheetTreeView2 from "../SpreadsheetTreeView2.vue";
import ConstraintSatisfactionDashboard2 from "../ConstraintSatisfactionDashboard2.vue";

@Component({
    components: {
        SpreadsheetTreeView2,
        ConstraintSatisfactionDashboard2,
    },
})
export default class ModifyResult extends Mixin(StoreState, AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.modifyResult;

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

    get annealResults() {
        const responseContent = this.state.annealResponse!.content as AxiosResponse;
        const responseData = responseContent.data as ToClientAnnealResponse.Root;

        // We're working on the presumption that we definitely have results
        return responseData.results!;
    }

    get annealNodeRoots() {
        return this.annealResults.map(res => res.result!.tree);
    }

    get annealSatisfactionMap() {
        return this.annealResults
            .map(res => res.result!.satisfaction)
            .reduce((carry, sMap) => Object.assign(carry, sMap), {});
    }

    get nodeToOverallSatisfactionMap() {
        const asMap = this.annealSatisfactionMap;

        return Object.keys(asMap)
            .reduce<{ [nodeId: string]: number | undefined }>((mapObj, nodeId) => {
                // Satisfaction of constraints for this node
                const nodeSatisfactionObject = asMap[nodeId];

                const constraintIds = Object.keys(nodeSatisfactionObject);

                // If there are no constraints to apply, then there is nothing 
                // add to the object
                if (constraintIds.length === 0) {
                    return mapObj;
                }

                // Sum and divide by number of constraints
                const satisfactionSum = constraintIds.reduce((sum, constraintId) => {
                    return sum + nodeSatisfactionObject[constraintId]!;
                }, 0);

                // Assign overall satisfaction to node ID
                mapObj[nodeId] = satisfactionSum / constraintIds.length;

                return mapObj;
            }, {});
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
    background: #ccc;
    flex-shrink: 0;
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

    position: relative;
}

.dashboard .constraint-satisfaction {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    overflow-y: auto;
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
