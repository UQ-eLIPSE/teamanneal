<template>
    <div>
        <div id="tree">
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
                                             :groupSizes="strataGroupSizes[i]"
                                             :isPartition="false"></StrataEditorStratumItem>
                </li>
            </ul>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import StrataEditorStratumItem from "./StrataEditorStratumItem.vue";

import * as UUID from "../data/UUID";
import * as Stratum from "../data/Stratum";
import * as Partition from "../data/Partition";
import * as ColumnInfo from "../data/ColumnInfo";
import * as SourceFile from "../data/SourceFile";
import * as ConstraintsConfig from "../data/ConstraintsConfig";

import { concat } from "../util/Array";

@Component({
    components: {
        StrataEditorStratumItem,
    },
})
export default class StrataEditor extends Vue {
    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    get constraintsConfigInStore() {
        const config: ConstraintsConfig.ConstraintsConfig = this.$store.state.constraintsConfig;
        return config;
    }

    get strata() {
        return this.constraintsConfigInStore.strata!;
    }

    /**
     * Determines if a partition column is set
     */
    get isPartitionColumnSet() {
        return this.constraintsConfigInStore.partitionColumnIndex !== undefined;
    }

    /**
     * Returns a shim object that projects the partition as stratum
     */
    get partitionStratumShimObject() {
        const columnInfo = this.fileInStore.columnInfo || [];
        const partitionColumnIndex = this.constraintsConfigInStore.partitionColumnIndex;

        if (partitionColumnIndex === undefined) {
            throw new Error("No partition column set");
        }

        const partitionColumnLabel = columnInfo[partitionColumnIndex].label;

        const stratumShim: Stratum.Stratum = {
            _id: UUID.generate(),
            label: `Partition (${partitionColumnLabel})`,
            size: {
                min: 0,
                ideal: 0,
                max: 0,
            },
            counter: [],
        }

        return stratumShim;
    }

    /**
     * Returns an array of objects which encodes the expected size distribution
     * of each stratum
     */
    get strataGroupSizes() {
        const strata = this.strata;

        // Splice records up into partitions
        const cookedData = this.fileInStore.cookedData!;
        const columnInfo = this.fileInStore.columnInfo!;
        const partitionColumnIndex = this.constraintsConfigInStore.partitionColumnIndex;

        let partitioningColumnInfo: ColumnInfo.ColumnInfo | undefined;

        if (partitionColumnIndex === undefined) {
            partitioningColumnInfo = undefined;
        } else {
            partitioningColumnInfo = columnInfo[partitionColumnIndex];
        }

        const partitions = Partition.createPartitions(cookedData, partitioningColumnInfo);

        // Run group sizing in each partition, and merge the distributions at
        // the end
        try {
            const strataGroupSizes =
                partitions
                    .map((partition) => {
                        // Generate group sizes for each partition
                        const numberOfRecordsInPartition = partition.length;
                        return Stratum.generateStrataGroupSizes(strata, numberOfRecordsInPartition);
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

            return strataGroupSizes;

        } catch (e) {
            // If error occurs, return blank array
            return [];
        }
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#tree {
    background: rgba(0, 0, 0, 0.05);

    width: 100%;
    height: auto;

    padding: 1rem;
}

#tree ul {
    margin: 0;
    padding: 0;
    list-style: none;

    background-image: linear-gradient(to top, transparent, transparent 1em, #a6b 7em, #a6b);
    background-position: left 1em top 0;
    background-repeat: no-repeat;
    background-size: 0.3em 100%;
}

#tree li {
    padding: 0;
}

#tree li+li {
    margin-top: 2rem;
}
</style>
