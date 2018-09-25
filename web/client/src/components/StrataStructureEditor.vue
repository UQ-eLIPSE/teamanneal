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
                                                      :editable="true"></StrataStructureEditorStratumItem>
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

import * as Stratum from "../data/Stratum";
import * as StratumSize from "../data/StratumSize";
import { Context as StratumNamingConfigContextEnum } from "../data/StratumNamingConfigContext";

import { AnnealCreator as S } from "../store";
import StrataStructureEditorStratumItem from "./StrataStructureEditorStratumItem.vue";

@Component({
    components: {
        StrataStructureEditorStratumItem,
    },
})
export default class StrataStructureEditor extends Vue {
    get strata() {
        return S.state.strataConfig.strata;
    }

    get subgroupButtonEnabled() {
        // Enable only for no more than 2 strata
        return this.strata.length < 2;
    }

    generateRandomStratumName() {
        const names = [
            "Group",
            "Subgroup",
        ];

        return names[(Math.random() * names.length) >>> 0];
    }

    async addNewStratum() {
        const stratumLabel = this.generateRandomStratumName();
        const stratumSize = StratumSize.init(2, 3, 4);

        // This is used to get the naming context (by default we set the 
        // contexts to the parent stratum)
        const parentStratum = this.strata[this.strata.length - 1];
        const stratumNamingConfigContext = parentStratum !== undefined ? parentStratum._id : StratumNamingConfigContextEnum.GLOBAL;

        const newStratum = Stratum.init(stratumLabel, stratumSize);

        await S.dispatch(S.action.UPSERT_STRATUM, newStratum);
        await S.dispatch(S.action.SET_STRATUM_NAMING_CONFIG_CONTEXT, { stratum: newStratum, context: stratumNamingConfigContext });
    }

    isStratumDeletable(i: number) {
        // Only substrata are deletable
        return i > 0;
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
