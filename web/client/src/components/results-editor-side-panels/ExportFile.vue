<template>
    <div class="export-file">
        <h2>Export</h2>
        <div class="export-option-block">
            <h3>Export TeamAnneal results package</h3>
            <p>Select this option to get a file that contains all data, including teams, needed for you to review teams and make changes in future.</p>
            <p>This
                <em>does not</em> contain your complete original anneal configuration.</p>
            <p>This file can only be opened within the TeamAnneal application.</p>
            <button class="button small"
                    @click="onExportResultsPackageButtonClick">Export results package</button>
        </div>
        <div class="export-option-block">
            <h3>Export only teams (CSV)</h3>
            <p>Select this option to get a CSV file that contains only annealed team information. This is formatted as all your existing record data with columns appended with team names.</p>
            <p>This file can be opened in any spreadsheet application.</p>
            <button class="button small gold"
                    @click="onExportCsvButtonClick">Export CSV</button>
            <button class="button small secondary">Advanced export options</button>

            <div class="export-option-block">
                <h4>Combined name column</h4>
                <p>You can choose to include a column in the output CSV that combines the individual names from each level into one.</p>
                <p>
                    <label><input type="checkbox"
                               v-model="p_enableGroupCombinedName">Include combined name column</label>
                </p>
                <p>
                    <table class="example-table">
                        <tr>
                            <th>Group level</th>
                            <th>Placeholder to use</th>
                        </tr>
                        <tr v-for="item in groupCombinedNameFormatPlaceholderList"
                            :key="item.label">
                            <td>{{ item.label }}</td>
                            <td>{{ item.placeholder }}</td>
                        </tr>
                    </table>
                </p>
                <p>
                    <input class="combined-name-format"
                           v-model="groupCombinedNameFormat"></input>
                </p>
                <p>
                    For example:
                    <i>{{ randomNodePathFormattedCombinedName }}</i>
                </p>
            </div>
        </div>
        <!-- TODO: Only show this block when anneal config detected -->
        <div class="export-option-block">
            <h3>Export TeamAnneal configuration</h3>
            <p>Select this option to export your anneal configuration as set in the TeamAnneal Creator. You can use this file to store and share your original set of parameters.</p>
            <p>This file can only be opened within the TeamAnneal application.</p>
            <button class="button small secondary"
                    @click="onExportConfigButtonClick">Export configuration</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";
import * as FileSaver from "file-saver";

import { ResultsEditor as S } from "../../store";

import { ColumnData } from "../../data/ColumnData";
import { GroupNode } from "../../data/GroupNode";
import * as Stratum from "../../data/Stratum";

import { pickRandom, reverse } from "../../util/Array";
import { replaceAll } from "../../util/String";

@Component
export default class ExportFile extends Vue {
    p_enableGroupCombinedName: boolean = true;
    p_groupCombinedNameFormat: string = "";

    async onExportResultsPackageButtonClick() {
        // Get state serialised and save as TeamAnneal results package 
        // (just a JSON file internally)
        const serialisedContent = await S.dispatch(S.action.DEHYDRATE, { deleteSideToolAreaActiveItem: true });

        const fileBlob = new Blob([serialisedContent], { type: "application/json" });

        FileSaver.saveAs(fileBlob, `export-${Date.now()}.taresults`, true);
    }

    onExportCsvButtonClick() {
        // TODO: Implement exporting
        throw new Error("Not implemented");
    }

    onExportConfigButtonClick() {
        // TODO: Implement exporting
        throw new Error("Not implemented");
    }

    /** 
     * Gets a random node path for the purposes of generating an example
     * combined name
     */
    get randomNodePath() {
        // Path is only a node ID path
        const path: string[] = [];

        function walkRandomPath(nodes: ReadonlyArray<GroupNode>): void {
            const randomNode = pickRandom(nodes);

            if (randomNode === undefined) {
                console.error("Node not found");
                return;
            }

            path.push(randomNode._id);

            switch (randomNode.type) {
                case "root":
                case "intermediate-stratum":
                    return walkRandomPath(randomNode.children);

                case "leaf-stratum":
                    // Can't go further
                    return;
            }
        }

        walkRandomPath(S.state.groupNode.structure.roots);

        return path;
    }

    get randomNodePathFormattedCombinedName() {
        const nameMap = S.state.groupNode.nameMap;
        const randomNodePath = this.randomNodePath;

        let combinedName = this.p_groupCombinedNameFormat;

        // Set partition name
        combinedName = replaceAll(combinedName, "{{_PARTITION}}", nameMap[randomNodePath[0]]);

        // Set stratum names
        //
        // Strata are ordered [lowest/leaf, ..., highest] whereas the random
        // path is [highest, ..., lowest/leaf]
        reverse(this.strata).forEach((stratum, i) => {
            combinedName = replaceAll(combinedName!, `{{${stratum._id}}}`, nameMap[randomNodePath[i + 1]]);
        });

        return combinedName;
    }
    get columns() {
        return S.state.recordData.columns;
    }
    get strata() {
        return S.state.strataConfig.strata;
    }

    get partitionColumnDescriptor() {
        return S.state.recordData.partitionColumn;
    }

    get partitionColumn() {
        const partitionColumnDesc = this.partitionColumnDescriptor;

        if (partitionColumnDesc === undefined) {
            return undefined;
        }

        return ColumnData.ConvertToDataObject(this.columns, partitionColumnDesc);
    }

    /**
     * Determines if a partition column is set
     */
    get isPartitionColumnSet() {
        return this.partitionColumnDescriptor !== undefined;
    }

    /**
     * Returns a shim object that projects the partition as stratum
     */
    get partitionStratumShimObject() {
        const partitionColumn = this.partitionColumnDescriptor;

        if (partitionColumn === undefined) {
            throw new Error("No partition column set");
        }

        const shimLabel = `Partition (${partitionColumn.label})`;

        return Stratum.init(shimLabel);
    }

    get groupCombinedNameFormatPlaceholderList() {
        const list = this.strata.map((stratum) => {
            return {
                label: stratum.label,
                placeholder: `{{${stratum.label}}}`,
            };
        });

        if (this.isPartitionColumnSet) {
            const partitionShimObject = this.partitionStratumShimObject;

            list.unshift({
                label: partitionShimObject.label,
                placeholder: "{{Partition}}",
            });
        }

        return list;
    }

    get groupCombinedNameFormat() {
        let format = this.p_groupCombinedNameFormat;

        // Get stratum labels back out because internally we use IDs
        this.strata.forEach(({ _id, label, }) => {
            format = replaceAll(format!, `{{${_id}}}`, `{{${label}}}`);
        });

        // Internally we use _PARTITION to represent the partition column
        format = replaceAll(format, "{{_PARTITION}}", "{{Partition}}");

        return format;
    }

    set groupCombinedNameFormat(newValue: string) {
        // Replace stratum labels with stratum IDs because internally we use IDs
        this.strata.forEach(({ _id, label, }) => {
            newValue = replaceAll(newValue!, `{{${label}}}`, `{{${_id}}}`);
        });

        // Internally we use _PARTITION to represent the partition column
        newValue = replaceAll(newValue, "{{Partition}}", "{{_PARTITION}}");

        this.p_groupCombinedNameFormat = newValue;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>
.export-option-block {
    border: 1px solid #49075E;
    background: rgba(73, 7, 94, 0.1);

    padding: 1em;
}

.export-option-block+.export-option-block {
    margin-top: 1em;
}

.export-option-block>h3,
.export-option-block>h4 {
    color: #49075E;
    margin-top: 0;
}
</style>
