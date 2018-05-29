<template>
    <div>
        <div class="constraints-editor">
            <ul>
                <li v-if="isPartitionColumnSet">
                    <ConstraintsEditorStratum :stratum="partitionStratumShimObject"
                                              :stratumConstraints="[]"
                                              :isPartition="true"></ConstraintsEditorStratum>
                </li>
                <li v-for="(stratum, i) in strata"
                    :key="stratum._id">
                    <ConstraintsEditorStratum :stratum="stratum"
                                              :stratumConstraints="getStratumConstraints(stratum)"
                                              :isPartition="false"
                                              :groupSizes="strataGroupSizes[i]"></ConstraintsEditorStratum>
                </li>
            </ul>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as Stratum from "../data/Stratum";
import * as StratumSize from "../data/StratumSize";
import * as Partition from "../data/Partition";

import { AnnealCreator as S } from "../store";

import { concat } from "../util/Array";

import ConstraintsEditorStratum from "./ConstraintsEditorStratum.vue";

@Component({
    components: {
        ConstraintsEditorStratum,
    },
})
export default class ConstraintsEditor extends Vue {
    get strata() {
        return S.state.strataConfig.strata;
    }

    get constraints() {
        return S.state.constraintConfig.constraints;
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

    getStratumConstraints(stratum: Stratum.Stratum) {
        const stratumId = stratum._id;
        return this.constraints.filter(constraint => constraint.stratum === stratumId);
    }

    /**
     * Returns an array where each element is the possible number of persons to
     * choose for groups at that particular stratum
     */
    get strataGroupSizes() {
        const strata = this.strata;
        const columns = S.state.recordData.columns;
        const partitionColumnDescriptor = S.state.recordData.partitionColumn;

        const partitions = Partition.initManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

        // Run group sizing in each partition, and merge the distributions at
        // the end
        try {
            const strataGroupSizes =
                partitions
                    .map((partition) => {
                        // Generate group sizes for each partition
                        const numberOfRecordsInPartition = Partition.getNumberOfRecords(partition);
                        const strataIndividualGroupSizes = StratumSize.generateStrataGroupSizes(strata.map(s => s.size), numberOfRecordsInPartition);

                        // Thin out the individual group sizes into just the unique
                        // group sizes
                        const strataUniqueGroupSizes =
                            strataIndividualGroupSizes.map((stratumGroupSizes) => {
                                const groupSizeSet = new Set<number>();
                                stratumGroupSizes.forEach(size => groupSizeSet.add(size));
                                return Array.from(groupSizeSet);
                            });

                        return strataUniqueGroupSizes;
                    })
                    .reduce((carry, incomingDistribution) => {
                        // Merge strata group size distribution arrays
                        return carry.map((existingDistribution, stratumIndex) => {
                            const distributionToAppend = incomingDistribution[stratumIndex];

                            return concat<number>([existingDistribution, distributionToAppend]);
                        });
                    })
                    .map((stratumGroupSizes) => {
                        // Do one more uniqueness filter
                        const groupSizeSet = new Set<number>();
                        stratumGroupSizes.forEach(size => groupSizeSet.add(size));
                        return Array.from(groupSizeSet).sort();
                    });

            return strataGroupSizes;

        } catch {
            // If error occurs, return empty arrays for each stratum
            return strata.map(_ => []);
        }
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.constraints-editor {
    background: rgba(0, 0, 0, 0.05);

    width: 100%;
    height: auto;

    padding: 1rem;

    position: relative;
}

.constraints-editor ul {
    margin: 0;
    padding: 0;
    list-style: none;

    background-image: linear-gradient(to top, transparent, transparent 1.1rem, #a6b 1.1rem, #a6b);
    background-position: left 1rem top 0;
    background-repeat: no-repeat;
    background-size: 0.3rem 100%;
}

.constraints-editor li {
    padding: 0;
}

.constraints-editor li+li {
    margin-top: 2rem;
}
</style>
