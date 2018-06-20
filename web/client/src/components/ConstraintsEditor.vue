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

import { AnnealCreator as S } from "../store";

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
        return S.get(S.getter.POSSIBLE_GROUP_SIZES_FOR_EACH_STRATUM);
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
