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
                                             :isPartition="false"
                                             @change="onStratumItemChange"></StrataEditorStratumItem>
                </li>
            </ul>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import StrataEditorStratumItem from "./StrataEditorStratumItem.vue";

import * as Stratum from "../data/Stratum";
import * as SourceFile from "../data/SourceFile";
import * as ConstraintsConfig from "../data/ConstraintsConfig";

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
        const config: Partial<ConstraintsConfig.ConstraintsConfig> = this.$store.state.constraintsConfig;
        return config;
    }

    get strata() {
        return this.constraintsConfigInStore.strata!;
    }

    onStratumItemChange(stratumUpdate: Stratum.Update) {
        this.$store.commit("updateConstraintsConfigStrata", stratumUpdate);
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
            _id: performance.now(),
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
