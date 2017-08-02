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

import { Data as IState } from "../data/State";
import { Stratum } from "../data/Stratum";
import { Partition } from "../data/Partition";

import { concat } from "../util/Array";

@Component({
    components: {
        StrataEditorStratumItem,
    },
})
export default class StrataEditor extends Vue {
    get state() {
        return this.$store.state as IState;
    }

    get strata() {
        return this.state.annealConfig.strata;
    }

    /**
     * Determines if a partition column is set
     */
    get isPartitionColumnSet() {
        return this.state.recordData.partitionColumn !== undefined;
    }

    /**
     * Returns a shim object that projects the partition as stratum
     */
    get partitionStratumShimObject() {
        const partitionColumn = this.state.recordData.partitionColumn;

        if (partitionColumn === undefined) {
            throw new Error("No partition column set");
        }

        const shimLabel = partitionColumn.label;
        const shimSize = {
            min: 0,
            ideal: 0,
            max: 0,
        };

        return Stratum.Init(shimLabel, shimSize);
    }

    /**
     * Returns an array of objects which encodes the expected size distribution
     * of each stratum
     */
    get strataGroupSizes() {
        const strata = this.strata;
        const columns = this.state.recordData.columns;
        const partitionColumnDescriptor = this.state.recordData.partitionColumn;

        const partitions = Partition.InitManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

        // Run group sizing in each partition, and merge the distributions at
        // the end
        try {
            const strataGroupSizes =
                partitions
                    .map((partition) => {
                        // Generate group sizes for each partition
                        const numberOfRecordsInPartition = Partition.GetNumberOfRecords(partition);
                        return Stratum.GenerateStrataGroupSizes(strata, numberOfRecordsInPartition);
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
