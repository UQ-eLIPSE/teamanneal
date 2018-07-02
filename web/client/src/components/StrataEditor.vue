<template>
    <div>
        <div class="editor-container">
            <ul>
                <li v-if="isPartitionColumnSet">
                    <StrataEditorStratumItem :stratum="partitionStratumShimObject"
                                             :stratumNamingConfig="partitionStratumNamingShimObject"
                                             :childUnit="strata[0].label"
                                             :isPartition="true"></StrataEditorStratumItem>
                </li>
                <li v-for="(stratum, i) in strata"
                    :key="stratum._id">
                    <StrataEditorStratumItem :stratum="stratum"
                                             :stratumNamingConfig="getStratumNamingConfig(stratum._id)"
                                             :childUnit="strata[i+1] ? strata[i+1].label : 'person'"
                                             :groupSizes="strataGroupDistribution[i]"
                                             :isPartition="false"
                                             :partitionColumnData="partitionColumnDescriptor"
                                             :namingContexts="strataNamingContexts[i]"></StrataEditorStratumItem>
                </li>
            </ul>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import StrataEditorStratumItem from "./StrataEditorStratumItem.vue";

import { ColumnData } from "../data/ColumnData";
import * as Stratum from "../data/Stratum";
import * as StratumSize from "../data/StratumSize";
import * as StratumNamingConfig from "../data/StratumNamingConfig";
import * as StratumNamingConfigContext from "../data/StratumNamingConfigContext";
import * as Partition from "../data/Partition";

import { AnnealCreator as S } from "../store";

import { concat } from "../util/Array";

@Component({
    components: {
        StrataEditorStratumItem,
    },
})
export default class StrataEditor extends Vue {
    get columns() {
        return S.state.recordData.source.columns;
    }

    get strataConfig() {
        return S.state.strataConfig;
    }

    get strata() {
        return this.strataConfig.strata;
    }

    getStratumNamingConfig(stratumId: string) {
        return StratumNamingConfig.getStratumNamingConfig(this.strataConfig, stratumId);
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

        const shimLabel = partitionColumn.label;

        return Stratum.init(shimLabel);
    }

    /**
     * Returns a shim object that satisfies the stratum naming config for a
     * partition
     */
    get partitionStratumNamingShimObject() {
        return StratumNamingConfig.init([], StratumNamingConfigContext.Context.GLOBAL);
    }

    /**
     * Returns an array of objects which encodes the expected size distribution
     * of each stratum
     */
    get strataGroupDistribution() {
        const strata = this.strata;
        const columns = this.columns;
        const partitionColumnDescriptor = this.partitionColumnDescriptor;

        // Run group sizing in each partition, and merge the distributions at
        // the end
        try {
            const partitions = Partition.initManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

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
</style>
