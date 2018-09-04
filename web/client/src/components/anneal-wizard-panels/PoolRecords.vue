<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Pool records</h1>
            <!-- TODO: Add help box back -->
            <p>
                Choose whether to use all records or split them into separate pools before forming groups.
            </p>
            <p>
                For example, if you have students which are associated with certain
                <i>project groups</i> and it is a requirement that you need groups that only have a homogeneous
                <i>project group</i> value, you would set the
                <i>"project group"</i> column to use for pooling your data.
            </p>
            <div class="pool-records-split-pane-wrapper">
                <div class="pool-records-split-pane">
                    <label class="pool-records-section-box"
                           :class="{ 'deselected': enablePartitioning === true }">
                        <h3><input type="radio"
                                   v-model="enablePartitioning"
                                   :value="false"> Form groups using any record</h3>
                        <div class="pool-records-example">
                            <div>
                                <div class="example-label"
                                     style="height: 8.2em;">
                                    <span>All records</span>
                                </div>
                            </div>
                            <div>
                                <span class="example-arrow"></span>
                            </div>
                            <div>
                                <b>TeamAnneal</b>
                            </div>
                        </div>
                        <p>All records will be used to form groups without pooling.</p>
                    </label>
                    <label class="pool-records-section-box"
                           :class="{ 'deselected': enablePartitioning === false }">
                        <h3><input type="radio"
                                   v-model="enablePartitioning"
                                   :value="true"> Form groups only within pools of records</h3>
                        <div class="pool-records-example">
                            <div>
                                <div v-for="partitionValue in examplePartitionList"
                                     :key="partitionValue"
                                     :title="partitionValue"
                                     class="example-label">
                                    <span>{{ ("" + partitionValue) || "&nbsp;" }}</span>
                                </div>
                            </div>
                            <div>
                                <span v-for="(_, i) in examplePartitionList"
                                      :key="i"
                                      class="example-arrow"></span>
                            </div>
                            <div>
                                <b>TeamAnneal</b>
                            </div>
                        </div>
                        <p>Records will be split into pools according to values in the selected column before forming groups.</p>
                        <p>
                            <select v-model="partitionColumn"
                                    :disabled="enablePartitioning === false">
                                <option v-for="(option, i) in formattedPartitionColumnList"
                                        :key="(option.value || {})._id"
                                        :value="option.value">{{ option.text }}</option>
                            </select>
                        </p>
                    </label>
                </div>
            </div>
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
import { Component, Mixin, Lifecycle } from "av-ts";

import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealCreator as S } from "../../store";
import { setMutation } from "../../util/MutationTrackerUtil";


import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class PoolRecords extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.poolRecords;

    /** 
     * Temporarily stores last set partition column to prevent the <select>
     * menu from having a value which changes unexpectedly
     */
    lastSetColumn: IColumnData_MinimalDescriptor | undefined = undefined;

    get columns() {
        return S.state.recordData.source.columns;
    }

    get numberOfRecords() {
        return S.state.recordData.source.length - 1;
    }

    get possiblePartitionColumns() {
        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = this.numberOfRecords;

        // Filter only those with column values non-unique (i.e. drop ID-like 
        // columns)
        return this.columns
            .filter((column) => {
                const valueSet = ColumnData.GetValueSet(column);
                return valueSet.size !== numberOfRecords;
            });
    }

    get partitionSizesPerColumn() {
        return this.possiblePartitionColumns
            .map((column) => {
                return {
                    column: ColumnData.ConvertToMinimalDescriptor(column),
                    size: ColumnData.GetValueSet(column).size,
                };
            });
    }

    get bestGuessPartitionColumn() {
        // Best guess partition column is one that isn't fully unique but not
        // so few in number (like something based on domestic/international
        // flag)
        //
        // Basic difference check used here, with the "guess" positioned around
        // when the first sharp change in size between different columns is
        // detected (> 5% of record data size)
        const columnsBySize = this.partitionSizesPerColumn.sort((a, b) => a.size - b.size);
        const deltaThreshold = (this.numberOfRecords * 0.05) >>> 0;

        for (let i = 1; i < columnsBySize.length; ++i) {
            // Return the column just before the big diff jump
            if ((columnsBySize[i].size - columnsBySize[i - 1].size) > deltaThreshold) {
                return columnsBySize[i - 1].column;
            }
        }

        // If nothing picked up, then just return the middle one
        return columnsBySize[(columnsBySize.length / 2) >>> 0].column;
    }

    get formattedPartitionColumnList() {
        const formattedList = this.possiblePartitionColumns
            .map((column) => ({
                text: column.label,
                value: ColumnData.ConvertToMinimalDescriptor(column),
            }));

        if (this.enablePartitioning) {
            // Return the list of possible columns
            return formattedList;

        } else {
            // Return a placeholder column list where the value is `undefined`
            // for the last set column, or the best guess if that is not
            // available
            const lastSetColumn = this.partitionColumnPlaceholder;

            return formattedList.map((x) => {
                if (x.value._id === lastSetColumn._id) {
                    return {
                        ...x,
                        value: undefined,
                    };
                } else {
                    return x;
                }
            });
        }
    }

    get partitionColumnPlaceholder() {
        return this.lastSetColumn || this.bestGuessPartitionColumn;
    }

    get examplePartitionList() {
        // Get the values in the unique set and clip to a max of 4
        const partitionColumn = this.partitionColumn || this.partitionColumnPlaceholder;
        const values = Array.from(ColumnData.GetValueSet(ColumnData.ConvertToDataObject(this.columns, partitionColumn)!) as Set<string | number>).sort();

        if (values.length <= 4) {
            return values.slice(0, 4);
        } else {
            // Return a list with "..." at the end as the 4th element
            return [...values.slice(0, 3), "..."];
        }
    }

    get enablePartitioning() {
        return S.state.recordData.partitionColumn !== undefined;
    }

    set enablePartitioning(val: boolean) {
        if (val) {
            // Set the last known column or the best guess
            this.partitionColumn = this.partitionColumnPlaceholder;
        } else {
            this.partitionColumn = undefined;
        }
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
            this.lastSetColumn = val;
            S.dispatch(S.action.SET_RECORD_PARTITION_COLUMN, val);
        }

        setMutation();
    }

    @Lifecycle mounted() {
        // Init the last set column with the partition column set in the state
        this.lastSetColumn = S.state.recordData.partitionColumn;
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

.pool-records-example {
    height: 7em;
    max-width: 20em;
    margin: 0 auto;

    display: flex;
    flex-direction: row;
}

.pool-records-example>div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    flex-grow: 1;
    flex-basis: 0;
}

.pool-records-example .example-label {
    display: inline-flex;
    background: #49075E;
    padding: 0.3em 1em;
    margin-top: 0.2em;
    border-radius: 0.3em;

    font-size: 0.9em;
    color: #fff;

    width: 100%;
    max-width: 10em;

    align-items: center;
    justify-content: center;
}

.pool-records-example .example-label>span {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    white-space: pre;
    text-overflow: ellipsis;
}

.pool-records-example .example-label:first-child {
    margin-top: 0;
}

.pool-records-example .example-arrow {
    position: relative;
    display: inline-block;
    width: 3em;
    height: 1.9em;
    margin-top: 0.2em;
    font-size: 0.9em;
    line-height: 0;
}

.pool-records-example .example-arrow:first-child {
    margin-top: 0;
}

.pool-records-example .example-arrow::before {
    content: "";
    display: inline-block;
    width: 2.5em;
    height: 0.5em;

    position: absolute;
    top: 0.65em;
    left: 0;

    background: linear-gradient(to right, transparent, #a6b 0.5em, #a6b);
}

.pool-records-example .example-arrow::after {
    content: "";
    display: inline-block;
    border-left: 0.8em solid #a6b;
    border-top: 0.6em solid transparent;
    border-bottom: 0.6em solid transparent;
    border-right: 0;

    position: absolute;
    top: 0.3em;
    right: 0;
}

.pool-records-split-pane-wrapper {
    display: block;
    margin: 1rem 0;
}

.pool-records-split-pane {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    align-content: flex-start;
}

.pool-records-section-box {
    border: 1px solid #49075E;
    background: rgba(73, 7, 94, 0.1);
    padding: 1.2em;
    margin-left: 1em;

    position: relative;
    z-index: 0;

    flex-basis: 0;
    flex-shrink: 0;
    flex-grow: 1;

    width: 35em;
    max-width: 35em;
    overflow: hidden;
}

.pool-records-section-box:first-child {
    margin-left: 0;
}

.pool-records-section-box::before {
    display: inline-block;
    width: 0.9em;
    text-align: center;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    font-size: 4em;
    font-weight: bold;
    line-height: 1;
    color: #fff;
}

.pool-records-section-box.deselected {
    border-color: rgba(50, 50, 50, 0.2);
    background: rgba(50, 50, 50, 0.1);
}

.pool-records-section-box.deselected .pool-records-example .example-label {
    background: rgba(50, 50, 50, 0.5);
}

.pool-records-section-box.deselected .pool-records-example .example-arrow::before {
    background: linear-gradient(to right, transparent, #bbb 0.5em, #bbb);
}

.pool-records-section-box.deselected .pool-records-example .example-arrow::after {
    border-left-color: #bbb;
}

.pool-records-section-box>h3 {
    margin-top: 0;
}
</style>
