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
                                              :nodeNameMap="nameMap"
                                              :idColumnIndex="idColumnIndex"></SpreadsheetTreeView2>
                    </div>
                    <div class="dashboard">
                        <ConstraintSatisfactionDashboard2 class="constraint-satisfaction"
                                                          :constraintSatisfactionMap="annealSatisfactionMap"
                                                          :selectedConstraint="selectedConstraint"
                                                          @constraintSelected="onConstraintSelected"></ConstraintSatisfactionDashboard2>
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
import { Data as IConstraint } from "../../data/Constraint";
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

    selectedConstraint: IConstraint | undefined = undefined;

    get columns() {
        return this.state.recordData.columns;
    }

    get strata() {
        return this.state.annealConfig.strata;
    }

    get constraints() {
        return this.state.annealConfig.constraints.reduce<{ [constraintId: string]: IConstraint | undefined }>((cObj, constraint) => {
            cObj[constraint._id] = constraint;
            return cObj;
        }, {});
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

                let constraintIds = Object.keys(nodeSatisfactionObject);

                // If there is a selected constraint, then only generate the 
                // satisfaction map with that constraint
                if (this.selectedConstraint !== undefined) {
                    const selectedConstraintId = this.selectedConstraint._id;
                    constraintIds = constraintIds.filter(constraintId => selectedConstraintId === constraintId);
                }

                // If there are no constraints to apply, then there is nothing 
                // to add to the object
                if (constraintIds.length === 0) {
                    return mapObj;
                }

                // Do a weighted satisfaction sum scaled to [0,1]
                const satisfaction = constraintIds.reduce<[number, number]>((satTuple, constraintId) => {
                    const constraint = this.constraints[constraintId];

                    if (constraint === undefined) {
                        throw new Error("Constraint not found");
                    }

                    const constraintWeight = constraint.weight;

                    // 0th index = sum of (weight * raw satisfaction)
                    satTuple[0] += constraintWeight * (nodeSatisfactionObject[constraintId] || 0);

                    // 1th index = sum of weights
                    satTuple[1] += constraintWeight;

                    return satTuple;
                }, [0, 0]);

                // Assign overall satisfaction to node ID
                mapObj[nodeId] = satisfaction[0] / satisfaction[1];

                return mapObj;
            }, {});
    }

    onConstraintSelected(constraint: IConstraint) {
        // Set the selected constraint when the previous value is undefined
        if (this.selectedConstraint === undefined) {
            this.selectedConstraint = constraint;
            return;
        }

        // Unset selected constraint if constraint selected again
        if (this.selectedConstraint._id === constraint._id) {
            this.selectedConstraint = undefined;
            return;
        }

        // Otherwise, overwrite the value of the selected constraint
        this.selectedConstraint = constraint;
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
