<template>
    <div>
        <div class="group-structure">
            <ul>
                <li v-if="isPartitionColumnSet">
                    <StrataStructureEditorStratumItem :stratum="partitionStratumShimObject"
                                                      :childUnit="strata[0].label"
                                                      :deletable="false"
                                                      :editable="false"></StrataStructureEditorStratumItem>
                </li>
                <li v-for="(stratum, i) in strata"
                    :key="stratum._id">
                    <StrataStructureEditorStratumItem :stratum="stratum"
                                                      :childUnit="strata[i+1] ? strata[i+1].label : 'person'"
                                                      :deletable="isStratumDeletable(i)"
                                                      :editable="true"
                                                      @change="onStratumItemChange"
                                                      @delete="onStratumItemDelete"></StrataStructureEditorStratumItem>
                </li>
                <li v-if="subgroupButtonEnabled">
                    <button class="button add-subgroup"
                            @click="addNewStratum">
                        <span>Add subgroup</span>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import StrataStructureEditorStratumItem from "./StrataStructureEditorStratumItem.vue";

import * as Stratum from "../data/Stratum";
import * as SourceFile from "../data/SourceFile";
import * as ConstraintsConfig from "../data/ConstraintsConfig";

@Component({
    components: {
        StrataStructureEditorStratumItem,
    },
})
export default class StrataStructureEditor extends Vue {
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

    get subgroupButtonEnabled() {
        // Enable only for no more than 2 strata
        return this.strata.length < 2;
    }

    onStratumItemChange(stratumUpdate: Stratum.Update) {
        this.$store.commit("updateConstraintsConfigStrata", stratumUpdate);
    }

    onStratumItemDelete(stratum: Stratum.Stratum) {
        this.$store.commit("deleteConstraintsConfigStrataOf", stratum._id);
    }

    generateRandomStratumName() {
        const names = [
            "Group",
            "Subgroup",
        ];

        return names[(Math.random() * names.length) >>> 0];
    }

    addNewStratum() {
        const stratum: Stratum.Stratum = {
            _id: performance.now(),
            label: this.generateRandomStratumName(),
            size: {
                min: 2,
                ideal: 3,
                max: 4,
            },
            counter: "decimal",
        }

        this.$store.commit("insertConstraintsConfigStrata", stratum);
    }

    isStratumDeletable(i: number) {
        // Only substrata are deletable
        return i > 0;
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
.group-structure {
    background: rgba(0, 0, 0, 0.05);

    width: 100%;
    height: auto;
}

.group-structure ul {
    margin: 0;
    padding: 1rem;
    list-style: none;
}

.group-structure li {
    text-align: center;
}

.group-structure li+li::before {
    display: block;
    content: "";

    margin: 0 auto;

    width: 0.3em;
    height: 1.5em;

    background: linear-gradient(to top, #a6b, #a6b 70%, transparent);
}

button.add-subgroup {
    display: flex;
    margin: 0 auto;

    width: 3em;
    height: 3em;

    border-radius: 50%;

    justify-content: center;
    align-items: center;

    position: relative;
}

button.add-subgroup>span {
    display: none;

    position: absolute;
    left: 3.7em;
    color: #777;

    text-align: left;
}

button.add-subgroup::before {
    display: block;
    content: "+";

    line-height: 0;

    font-size: 3em;
    font-weight: 100;

    margin-top: -0.05em;
}

button.add-subgroup:hover>span,
button.add-subgroup:focus>span,
button.add-subgroup:active>span {
    display: block;
}
</style>
