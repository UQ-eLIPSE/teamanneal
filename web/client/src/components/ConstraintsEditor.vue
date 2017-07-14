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

import * as UUID from "../data/UUID";
import * as Stratum from "../data/Stratum";
import * as SourceFile from "../data/SourceFile";
import * as ConstraintsConfig from "../data/ConstraintsConfig";

import ConstraintsEditorStratum from "./ConstraintsEditorStratum.vue";

@Component({
    components: {
        ConstraintsEditorStratum,
    },
})
export default class ConstraintsEditor extends Vue {
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

    get constraints() {
        return this.constraintsConfigInStore.constraints;
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

    getStratumConstraints(stratum: Stratum.Stratum) {
        const stratumId = stratum._id;
        return this.constraints.filter(constraint => constraint._stratumId === stratumId);
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
