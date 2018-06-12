<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Pool records</h1>
            <!-- TODO: Add help box back -->
            <p>
                Choose to either use all records in one pool or split them into separate pools when forming teams.
            </p>
            <p>
                For example, if you have students which are associated with certain
                <i>project groups</i> and it is a requirement that you need groups that only have a homogeneous
                <i>project group</i> value, you would set the
                <i>"project group"</i> column to use for pooling your data.
            </p>
            <p>
                <select v-model="partitionColumn">
                    <option v-for="(option, i) in possiblePartitionColumns"
                            :key="option.text + i"
                            :value="option.value">{{ option.text }}</option>
                </select>
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="emitWizardNavNext"
                    :disabled="isWizardNavNextDisabled">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealCreator as S } from "../../store";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class PoolRecords extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.poolRecords;

    setPartitionColumn() {
        // Partition should already be set reactively; just move on to next step
        this.emitWizardNavNext();
    }

    async skipPartitioning() {
        // Delete partition column
        await S.dispatch(S.action.CLEAR_RECORD_PARTITION_COLUMN, undefined);

        this.emitWizardNavNext();
    }

    get possiblePartitionColumns() {
        const recordData = S.state.recordData;
        const columns = recordData.columns;
        const recordDataRawLength = recordData.source.length;

        // No data to even process
        if (columns.length === 0) { return []; }

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = recordDataRawLength - 1;

        // Filter only those with column values non-unique (i.e. drop ID-like 
        // columns)
        return [
            {
                text: "-- DISABLE PARTITIONING --",
                value: undefined,
            },
            ...columns
                .filter((column) => {
                    const valueSet = ColumnData.GetValueSet(column);
                    return valueSet.size !== numberOfRecords;
                })
                .map((column) => ({
                    text: column.label,
                    value: ColumnData.ConvertToMinimalDescriptor(column),
                })),
        ];
    }

    get partitionColumn(): IColumnData_MinimalDescriptor | undefined {
        const partitionColumn = S.state.recordData.partitionColumn;

        if (partitionColumn === undefined) {
            return undefined;
        }

        return partitionColumn;
    }

    set partitionColumn(val: IColumnData_MinimalDescriptor | undefined) {
        if (val === undefined) {
            S.dispatch(S.action.CLEAR_RECORD_PARTITION_COLUMN, undefined);
        } else {
            S.dispatch(S.action.SET_RECORD_PARTITION_COLUMN, val);
        }
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.example-table {
    border-collapse: collapse;
}

.example-table th,
.example-table td {
    border: 1px solid #aaa;
    padding: 0.1em 0.3em;
}
</style>
