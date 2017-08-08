<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Select partition column</h1>
            <p>
                If you need to form groups based on existing groupings in your data, select the corresponding column as a partition for the data.
                <a class="more help-link"
                   :class="{'active': showHelp}"
                   href="#"
                   @click.prevent="toggleHelp">Need help?</a>
            </p>
            <div class="help-box"
                 v-if="showHelp">
                <h2>What a partition is</h2>
                <p>A partition is a subset of your data, such that groups and constraints only apply to each partition subset, rather than the global set of person records.</p>
    
                <h2>When a partition should be used, and how to configure the partition column</h2>
                <p>Partitions are only useful if you have subsets within your entire data set where you require TeamAnneal not to be able to form teams with members from a different subset.</p>
                <p>Should you decide to partition your data set, select the column that contains values which identifies which partition subset a person belongs to.</p>
                <p>For example - You have 2 types of project in your course, and you wish to only form groups within each project type, not across them:</p>
                <table class="example-table">
                    <thead>
                        <tr>
                            <th>StudentID</th>
                            <th>Last Name</th>
                            <th>First Name</th>
                            <th>Project</th>
                            <th>Discipline</th>
                            <th>Gender</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>40587853</td>
                            <td>Lueilwitz</td>
                            <td>Earnestine</td>
                            <td>P01</td>
                            <td>Electrical</td>
                            <td>Male</td>
                        </tr>
                        <tr>
                            <td>40433178</td>
                            <td>Heller</td>
                            <td>Sarah</td>
                            <td>P01</td>
                            <td>Mechanical</td>
                            <td>Female</td>
                        </tr>
                        </tr>
                        <tr>
                            <td>40341654</td>
                            <td>Jewess</td>
                            <td>Corbin</td>
                            <td>P02</td>
                            <td>Electrical</td>
                            <td>Male</td>
                        </tr>
                        </tr>
                        <tr>
                            <td>40168610</td>
                            <td>Kutch</td>
                            <td>Jessica</td>
                            <td>P01</td>
                            <td>Mechatronic</td>
                            <td>Female</td>
                        </tr>
                        <tr>
                            <td>40454557</td>
                            <td>Bartell</td>
                            <td>Madilyn</td>
                            <td>P02</td>
                            <td>Mechanical</td>
                            <td>Female</td>
                        </tr>
                        </tr>
                        <tr>
                            <td>40265742</td>
                            <td>Ebert</td>
                            <td>Nicholaus</td>
                            <td>P02</td>
                            <td>Software</td>
                            <td>Male</td>
                        </tr>
                    </tbody>
                </table>
                <p>If you were to select "Project" as the partition column, TeamAnneal will run two separate anneals for your constraints: one for the people in "P01", and one for those in "P02".</p>
                <p>This way, you are guaranteed to have groups which are only formed
                    <u>within</u> the subsets you select - in this example, you will get groups that have a homogeneous project value "P01" or "P02" but not a mixture of both.</p>
    
                <h2>Partition limitations</h2>
                <p>At present, TeamAnneal only supports up to one column with which to partition your data.</p>
                <p>If you require finer control over partitioning, you will need to split your data into separate files and perform separate anneals with each of them.</p>
            </div>
            <p>
                For example, in your data you may already have assigned students to
                <i>"project"</i> groups. It may be a requirement that you need groups that require these
                <i>project</i> groups to be considered as a whole; i.e. all students in the same
                <i>project</i> working together. In this situation, you would set the
                <i>"project"</i> column as a partition for your data.
            </p>
            <p>
                If you do not need to set a partition or need to unset the partition column, click "Don't partition".
            </p>
            <p>
                <select v-model="partitionColumn">
                    <option disabled
                            :value="undefined">Please select partition column</option>
                    <option v-for="option in possiblePartitionColumns"
                            :key="option.value"
                            :value="option.value">{{ option.text }}</option>
                </select>
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="setPartitionColumn"
                    :disabled="partitionColumn === undefined">Set partition column</button>
            <button class="button gold"
                    @click="skipPartitioning">Don't partition</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import { ColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";
import { StoreState } from "../StoreState";

@Component
export default class SelectPartitionColumn extends Mixin<StoreState & AnnealProcessWizardPanel>(StoreState, AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.selectPartitionColumn;

    setPartitionColumn() {
        // Partition should already be set reactively; just move on to next step
        this.emitWizardNavNext();
    }

    async skipPartitioning() {
        // Delete partition column
        await this.$store.dispatch("deletePartitionColumn");

        this.emitWizardNavNext();
    }

    get possiblePartitionColumns() {
        const columns = this.state.recordData.columns;
        const recordDataRawLength = this.state.recordData.source.length;

        // No data to even process
        if (columns.length === 0) { return []; }

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = recordDataRawLength - 1;

        // Filter only those with column values non-unique (i.e. drop ID-like 
        // columns)
        return columns
            .filter((column) => {
                const valueSet = ColumnData.GetValueSet(column);
                return valueSet.size !== numberOfRecords;
            })
            .map((column) => ({
                text: column.label,
                value: ColumnData.ConvertToMinimalDescriptor(column),
            }));
    }

    get partitionColumn(): IColumnData_MinimalDescriptor | undefined {
        const partitionColumn = this.state.recordData.partitionColumn;

        if (partitionColumn === undefined) {
            return undefined;
        }

        return partitionColumn;
    }

    set partitionColumn(val: IColumnData_MinimalDescriptor | undefined) {
        this.$store.dispatch("setPartitionColumn", val);
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
