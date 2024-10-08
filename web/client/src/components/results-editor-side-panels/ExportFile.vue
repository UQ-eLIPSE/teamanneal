<template>
    <div class="export-file">
        <h2>Export</h2>
        <div class="export-option-block">
            <h3>Export TeamAnneal results package</h3>
            <p>This file can be used to review or modify teams in the future.</p>
            <p>It can also be used to set a new anneal configuration in the TeamAnneal Creator</p>
            <p><b>This file can only be opened within the TeamAnneal application.</b></p>
            <button class="button small"
                    @click="exportResultsPackage">Export results package</button>
        </div>
        <div class="export-option-block">
            <h3>Export only teams (CSV)</h3>
            <p>Exports the results into a CSV file. The team columns are appended at the end of the file.</p>
            <p><b>This file can be opened in any spreadsheet application such as Microsoft Excel.</b></p>
            <button class="button small gold"
                    @click="exportCsv">Export CSV</button>
            <button class="button small secondary"
                    @click="toggleCsvAdvancedOptions">Advanced options</button>
            <div v-if="p_showCsvAdvancedOptions"
                 class="export-option-block advanced-options">
                <h4>Combined name column</h4>
                <p>You can choose to include a column in the output CSV that combines the individual names from each level into one.</p>
                <p>
                    <label><input type="checkbox"
                               v-model="p_enableGroupCombinedName">Include combined name column</label>
                </p>
                <template v-if="p_enableGroupCombinedName">
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
                               v-model="groupCombinedNameFormatUserFriendly"></input>
                    </p>
                    <p>
                        For example:
                        <i>{{ randomNodePathFormattedCombinedName }}</i>
                    </p>
                </template>
            </div>
        </div>
        <!-- TODO: Only show this block when anneal config detected -->
        <div class="export-option-block">
            <h3>Export TeamAnneal configuration</h3>
            <p>This file contains the configuration used to create this anneal.</p>
            <p>It should be noted this file does not contain the data or records associated with the anneal</p>
            <p><b>This file can only be opened within the TeamAnneal application.</b></p>
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
// Unfortunately we need all exports to be affect flags unless we create an additional subfolder/different controller
import { AnnealCreator as A } from "../../store";

import * as Record from "../../../../common/Record";

import { ColumnData } from "../../data/ColumnData";
import { GroupNode } from "../../data/GroupNode";
import * as Stratum from "../../data/Stratum";

import { pickRandom } from "../../util/Array";
import { replaceAll } from "../../util/String";
import { unparseFile } from "../../util/CSV";

@Component
export default class ExportFile extends Vue {
    /** Indicates whether to show the CSV export advanced options. */
    p_showCsvAdvancedOptions: boolean = false;

    /** Indicates whether group combined name export is enabled. */
    p_enableGroupCombinedName: boolean = true;

    /**
     * Internal representation of the combined name format.
     * 
     * If value is `undefined`, this indicates that the user did not set a
     * format manually, and the system is expected to deliver a default instead.
     */
    p_groupCombinedNameFormat: string | undefined = undefined;

    async exportResultsPackage() {
        // Get state serialised and save as TeamAnneal results package 
        // (just a JSON file internally)
        const serialisedContent = await S.dispatch(S.action.DEHYDRATE, { deleteSideToolAreaActiveItem: true });

        const fileBlob = new Blob([serialisedContent], { type: "application/json" });

        FileSaver.saveAs(fileBlob, `export-${Date.now()}.taresults`, true);
    }

    toggleCsvAdvancedOptions() {
        this.p_showCsvAdvancedOptions = !this.p_showCsvAdvancedOptions;
    }

    exportCsv() {
        // Get node name map
        const strata = this.strata;
        const nameMap = this.nameMap;

        // Get the columns and transform them back into 2D string array for
        // exporting, and include the headers in the output while we're at it
        const rows = ColumnData.TransposeIntoRawValueRowArray(this.columns, true);

        // We use cooked values for the record ID columns for referencing
        const idColumnMinimalDescriptor = S.state.recordData.idColumn;

        if (idColumnMinimalDescriptor === undefined) {
            throw new Error("No ID column defined");
        }

        const idColumn = ColumnData.ConvertToDataObject(this.columns, idColumnMinimalDescriptor);

        if (idColumn === undefined) {
            throw new Error("ID column does not exist or data could not be retrieved");
        }

        const idColumnValues = ColumnData.GenerateCookedColumnValues(idColumn);



        // Convert tree into paths
        const recordIdToNodePathMap = new Map<Record.RecordElement, ReadonlyArray<string>>();
        const nodeRecordArrayMap = S.state.groupNode.nodeRecordArrayMap;

        function walkAndIndexPaths(node: GroupNode, path: string[]): void {
            const pathInclThisNode = [...path, node._id];

            switch (node.type) {
                case "root":
                case "intermediate-stratum": {
                    return node.children.forEach(child => walkAndIndexPaths(child, pathInclThisNode));
                }

                case "leaf-stratum": {
                    const recordIds = nodeRecordArrayMap[node._id];
                    return recordIds.forEach(recordId => recordIdToNodePathMap.set(recordId, pathInclThisNode));
                }
            }
        }

        this.groupNodeRoots.forEach(root => walkAndIndexPaths(root, []));



        rows.forEach((row, i) => {
            // Add stratum labels to the header row
            if (i === 0) {
                const headerRow = row;
                strata.forEach((stratum) => {
                    headerRow.push(stratum.label);
                });

                // Add one more column header for combined group names if 
                // requested
                if (this.p_enableGroupCombinedName) {
                    headerRow.push("Combined name");
                }

                return;
            }

            // Append name values to end of ordinary row

            // Note that this is not the same as row[idColumnIndex] as the row
            // is always the raw value (string[]), while the record ID values in
            // the name map are cooked values
            const recordId = idColumnValues[i - 1]; // Remember that `i = 0` is the header row


            // Get path for this record ID
            const path = recordIdToNodePathMap.get(recordId)!;

            // Append name for each stratum
            path.forEach((nodeId, i) => {
                // Ignore the root node name because it is never used
                if (i === 0) { return; }

                row.push(nameMap[nodeId]);
            });

            // Push combined name if requested
            if (this.p_enableGroupCombinedName) {
                const combinedName = this.formatNodePathToCombinedName(path);
                row.push(combinedName);
            }
        });

        // Export as CSV
        const sourceFileName = S.state.recordData.source.name;

        unparseFile(rows, `${sourceFileName}.teamanneal.csv`);
    }

    async onExportConfigButtonClick() {
        // Export only anneal config
        const serialisedContent = await S.dispatch(S.action.DEHYDRATE_ANNEAL_CONFIG, { deleteRecordDataSource: true, deleteAnnealRequest: true });
        A.dispatch(A.action.SET_MUTATION_FLAG_LOW, undefined);

        const fileBlob = new Blob([serialisedContent], { type: "application/json" });

        FileSaver.saveAs(fileBlob, `export-${Date.now()}.taconfig`, true);
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

        walkRandomPath(this.groupNodeRoots);

        return path;
    }

    get randomNodePathFormattedCombinedName() {
        return this.formatNodePathToCombinedName(this.randomNodePath);
    }

    formatNodePathToCombinedName(path: ReadonlyArray<string>) {
        const nameMap = this.nameMap;

        let combinedName = this.groupCombinedNameFormatInternal;

        // Set partition name
        combinedName = replaceAll(combinedName, "{{_PARTITION}}", nameMap[path[0]]);

        // Set stratum names
        this.strata.forEach((stratum, i) => {
            combinedName = replaceAll(combinedName!, `{{${stratum._id}}}`, nameMap[path[i + 1]]);
        });

        return combinedName;
    }

    get columns() {
        return S.state.recordData.source.columns;
    }

    get strata() {
        return S.state.strataConfig.strata;
    }

    get nameMap() {
        return S.state.groupNode.nameMap;
    }

    get groupNodeRoots() {
        return S.state.groupNode.structure.roots;
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

        const shimLabel = `Pool (${partitionColumn.label})`;

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
                placeholder: "{{Pool}}",
            });
        }

        return list;
    }

    get defaultGroupCombinedNameFormat() {
        const levels: string[] = [];

        // Prepend partition if set
        if (this.isPartitionColumnSet) {
            levels.push("{{_PARTITION}}");
        }

        // Go through each stratum and add them in order
        this.strata.forEach(({ _id }) => levels.push(`{{${_id}}}`));

        return levels.join(" - ");
    }

    get groupCombinedNameFormatInternal() {
        const format = this.p_groupCombinedNameFormat;

        if (format === undefined) {
            return this.defaultGroupCombinedNameFormat;
        }

        return format;
    }

    set groupCombinedNameFormatInternal(format: string) {
        this.p_groupCombinedNameFormat = format;
    }

    get groupCombinedNameFormatUserFriendly() {
        let format = this.groupCombinedNameFormatInternal;

        // Get stratum labels back out because internally we use IDs
        this.strata.forEach(({ _id, label, }) => {
            format = replaceAll(format!, `{{${_id}}}`, `{{${label}}}`);
        });

        // Internally we use _PARTITION to represent the partition column
        format = replaceAll(format, "{{_PARTITION}}", "{{Pool}}");

        return format;
    }

    set groupCombinedNameFormatUserFriendly(newValue: string) {
        // Replace stratum labels with stratum IDs because internally we use IDs
        this.strata.forEach(({ _id, label, }) => {
            newValue = replaceAll(newValue!, `{{${label}}}`, `{{${_id}}}`);
        });

        // Internally we use _PARTITION to represent the partition column
        newValue = replaceAll(newValue, "{{Pool}}", "{{_PARTITION}}");

        this.groupCombinedNameFormatInternal = newValue;
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

.advanced-options {
    margin-top: 1em;
}

.combined-name-format {
    width: 100%;
}

.example-table {
    border-collapse: collapse;
    font-size: 0.9em;
    width: 100%;
}

.example-table th,
.example-table td {
    text-align: left;
    border: 1px solid rgba(0, 0, 0, 0.2);
    padding: 0.1em 0.3em;
}
</style>
