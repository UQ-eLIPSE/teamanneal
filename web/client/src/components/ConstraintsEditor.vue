<template>
    <div>
        <div class="constraints-editor">
            <ul>
                <li v-if="isPartitionColumnSet">
                    <ConstraintsEditorStratum :stratum="partitionStratumShimObject"
                                              :stratumConstraints="[]"
                                              :isPartition="true"></ConstraintsEditorStratum>
                </li>
                <li v-for="stratum in strata"
                    :key="stratum._id">
                    <ConstraintsEditorStratum :stratum="stratum"
                                              :stratumConstraints="getStratumConstraints(stratum)"
                                              :isPartition="false"></ConstraintsEditorStratum>
                </li>
            </ul>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { Data as IState } from "../data/State";
import { Stratum, Data as IStratum } from "../data/Stratum";

import ConstraintsEditorStratum from "./ConstraintsEditorStratum.vue";

@Component({
    components: {
        ConstraintsEditorStratum,
    },
})
export default class ConstraintsEditor extends Vue {
    get state() {
        return this.$store.state as IState;
    }

    get strata() {
        return this.state.annealConfig.strata;
    }

    get constraints() {
        return this.state.annealConfig.constraints;
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

        const shimLabel = `Partition (${partitionColumn.label})`;
        const shimSize = {
            min: 0,
            ideal: 0,
            max: 0,
        };

        return Stratum.Init(shimLabel, shimSize);
    }

    getStratumConstraints(stratum: IStratum) {
        const stratumId = stratum._id;
        return this.constraints.filter(constraint => constraint.stratum === stratumId);
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
