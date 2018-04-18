<template>
    <div>
        <div class="editor-container">
            <ul>
                <li v-if="isPartitionColumnSet">
                    <StrataEditorStratumItem :stratum="partitionStratumShimObject"
                                             :childUnit="strata[0].label"
                                             :isPartition="true"></StrataEditorStratumItem>
                </li>
                <li v-for="(stratum, i) in strata"
                    :key="stratum._id">
                    <StrataEditorStratumItem :stratum="stratum"
                                             :childUnit="strata[i+1] ? strata[i+1].label : 'person'"
                                             :groupSizes="strataGroupDistribution[i]"
                                             :isPartition="false"
                                             :partitionColumnData="state.recordData.partitionColumn"
                                             :namingContexts="strataNamingContexts[i]"></StrataEditorStratumItem>
                </li>
            </ul>
        </div>
        <div class="combined-name-container">
            <h2>Combined group name format</h2>
            <p>Provide a format to generate a single combined name for each of your groups. This will be available in your results and exported CSV file.</p>
            <p>Use the following placeholders to insert each group level's name values:</p>
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
            <p>Set this field blank if you wish to disable this feature.</p>
            <input class="combined-name-format"
                   v-model="groupCombinedNameFormat"></input>
            <p v-if="groupCombinedNameExample !== undefined">
                For example:
                <i>{{ groupCombinedNameExample }}</i>
            </p>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component } from "av-ts";

import StrataEditorStratumItem from "./StrataEditorStratumItem.vue";

import { ColumnData } from "../data/ColumnData";
import * as Stratum from "../data/Stratum";
import * as StratumSize from "../data/StratumSize";
import * as StratumNamingConfig from "../data/StratumNamingConfig";
import * as Partition from "../data/Partition";

import { AnnealCreator as S } from "../store";

import { concat } from "../util/Array";
import { replaceAll } from "../util/String";

@Component({
    components: {
        StrataEditorStratumItem,
    },
})
export default class StrataEditor {
    get columns() {
        return S.state.recordData.columns;
    }

    get strata() {
        return S.state.strataConfig.strata;
    }

    get partitionColumn() {
        const partitionColumnDesc = S.state.recordData.partitionColumn;

        if (partitionColumnDesc === undefined) {
            return undefined;
        }

        return ColumnData.ConvertToDataObject(this.columns, partitionColumnDesc);
    }

    /**
     * Determines if a partition column is set
     */
    get isPartitionColumnSet() {
        return S.state.recordData.partitionColumn !== undefined;
    }

    /**
     * Returns a shim object that projects the partition as stratum
     */
    get partitionStratumShimObject() {
        const partitionColumn = S.state.recordData.partitionColumn;

        if (partitionColumn === undefined) {
            throw new Error("No partition column set");
        }

        const shimLabel = `Partition (${partitionColumn.label})`;

        return Stratum.init(shimLabel);
    }

    /**
     * Returns an array of objects which encodes the expected size distribution
     * of each stratum
     */
    get strataGroupDistribution() {
        const strata = this.strata;
        const columns = S.state.recordData.columns;
        const partitionColumnDescriptor = S.state.recordData.partitionColumn;

        const partitions = Partition.initManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

        // Run group sizing in each partition, and merge the distributions at
        // the end
        try {
            const strataGroupDistribution =
                partitions
                    .map((partition) => {
                        // Generate group sizes for each partition
                        const numberOfRecordsInPartition = Partition.getNumberOfRecords(partition);
                        return StratumSize.generateStrataGroupSizes(strata.map(s => s.size), numberOfRecordsInPartition);
                    })
                    .reduce((carry, incomingDistribution) => {
                        // Merge strata group size distribution arrays
                        return carry.map((existingDistribution, stratumIndex) => {
                            const distributionToAppend = incomingDistribution[stratumIndex];

                            return concat<number>([existingDistribution, distributionToAppend]);
                        });
                    })
                    .map((stratumDistribution) => {
                        // Convert group size distribution array into object that
                        // maps the group size (key) to the count of that particular
                        // group size in the stratum (value)
                        const stratumGroupSizeInfo: { [groupSize: number]: number } = {};

                        stratumDistribution.forEach((groupSize) => {
                            // Increment the count for this particular group size
                            stratumGroupSizeInfo[groupSize] = (stratumGroupSizeInfo[groupSize] || 0) + 1;
                        });

                        return stratumGroupSizeInfo;
                    });

            return strataGroupDistribution;

        } catch (e) {
            // If error occurs, return blank array
            return [];
        }
    }

    /**
     * Returns an array of possible naming context contexts for each stratum at
     * the ith index
     */
    get strataNamingContexts() {
        const strata = this.strata;

        const accumulatedStrata: Stratum.Stratum[] = [];
        const outputList: Stratum.Stratum[][] = [];

        strata.forEach((stratum) => {
            // Copy the accumulated strata array into the output list
            outputList.push([...accumulatedStrata]);

            // Accumulate this stratum
            accumulatedStrata.push(stratum);

        });

        return outputList;
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

    get groupCombinedNameExample() {
        let combinedName = S.state.nodeNamingConfig.combined.format;

        if (combinedName === undefined) {
            return undefined;
        }

        // Set random partition name
        const partitionColumn = this.partitionColumn;
        if (partitionColumn !== undefined) {
            const partitionValues = partitionColumn.rawColumnValues;
            const randomPartitionName = "" + partitionValues[(partitionValues.length * Math.random()) >>> 0];

            combinedName = replaceAll(combinedName, "{{_PARTITION}}", randomPartitionName);
        }

        // Set stratum names
        this.strata.forEach((stratum) => {
            const randomStratumName = StratumNamingConfig.generateRandomExampleName(stratum);

            combinedName = replaceAll(combinedName!, `{{${stratum._id}}}`, randomStratumName);
        });

        return combinedName;
    }

    get groupCombinedNameFormat() {
        let format = S.state.nodeNamingConfig.combined.format;

        if (format === undefined) {
            return undefined;
        }

        // Get stratum labels back out because internally we use IDs
        this.strata.forEach(({ _id, label, }) => {
            format = replaceAll(format!, `{{${_id}}}`, `{{${label}}}`);
        });

        // Internally we use _PARTITION to represent the partition column
        format = replaceAll(format, "{{_PARTITION}}", "{{Partition}}");

        return format;
    }

    set groupCombinedNameFormat(newValue: string | undefined) {
        if (newValue === undefined || newValue.trim().length === 0) {
            S.dispatch(S.action.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT_BY_USER, undefined);
            return;
        }

        // Replace stratum labels with stratum IDs because internally we use IDs
        this.strata.forEach(({ _id, label, }) => {
            newValue = replaceAll(newValue!, `{{${label}}}`, `{{${_id}}}`);
        });

        // Internally we use _PARTITION to represent the partition column
        newValue = replaceAll(newValue, "{{Partition}}", "{{_PARTITION}}");

        S.dispatch(S.action.SET_NODE_NAMING_COMBINED_NAME_FORMAT_BY_USER, newValue);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.editor-container,
.combined-name-container {
    background: rgba(0, 0, 0, 0.05);

    width: 100%;
    height: auto;

    padding: 1rem;
}

.editor-container ul {
    margin: 0;
    padding: 0;
    list-style: none;

    background-image: linear-gradient(to top, transparent, transparent 1em, #a6b 7em, #a6b);
    background-position: left 1em top 0;
    background-repeat: no-repeat;
    background-size: 0.3em 100%;
}

.editor-container li {
    padding: 0;
}

.editor-container li+li {
    margin-top: 2rem;
}

.combined-name-container {
    margin-top: 1em;
}

.combined-name-container h2 {
    margin-top: 0;

    font-weight: 500;
    color: #49075E;
}

input.combined-name-format {
    width: 100%;
    max-width: 30em;
}

.example-table {
    border-collapse: collapse;
    font-size: 0.9em;
}

.example-table th,
.example-table td {
    text-align: left;
    border: 1px solid #aaa;
    padding: 0.1em 0.3em;
}
</style>
