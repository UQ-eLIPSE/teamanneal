<template>
    <div>
        <div id="tree">
            <ul>
                <li v-for="(stratum, i) in strata">
                    <StrataStructureEditorStratumItem :key="stratum._id" @change="onStratumItemChange" @delete="onStratumItemDelete" @swapUp="onStratumItemSwapUp" @swapDown="onStratumItemSwapDown" :stratum="stratum" :childUnit="strata[i+1] ? strata[i+1].label : 'person'" />
                </li>
            </ul>
        </div>
        <div id="action-buttons">
            <button @click="addNewStratum">Add subgroup</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import StrataStructureEditorStratumItem from "./StrataStructureEditorStratumItem.vue";

import * as Stratum from "../data/Stratum";

@Component({
    components: {
        StrataStructureEditorStratumItem,
    },
})
export default class StrataStructureEditor extends Vue {
    get strata() {
        return this.$store.state.constraintsConfig.strata!;
    }

    onStratumItemChange(stratumUpdate: Stratum.Update) {
        this.$store.commit("updateConstraintsConfigStrata", stratumUpdate);
    }

    onStratumItemDelete(stratum: Stratum.Stratum) {
        this.$store.commit("deleteConstraintsConfigStrataOf", stratum._id);
    }

    onStratumItemSwapUp(stratum: Stratum.Stratum) {
        this.$store.commit("swapUpConstraintsConfigStrataOf", stratum._id);
    }

    onStratumItemSwapDown(stratum: Stratum.Stratum) {
        this.$store.commit("swapDownConstraintsConfigStrataOf", stratum._id);
    }

    addNewStratum() {
        const stratum: Stratum.Stratum = {
            _id: performance.now(),
            label: `Subgroup${this.strata.length + 1}`,
            size: {
                min: 1,
                ideal: 2,
                max: 3,
            },
        }

        this.$store.commit("insertConstraintsConfigStrata", stratum);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#tree {
    background: rgba(0, 0, 0, 0.05);

    width: 100%;
    height: auto;
}

#tree ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

#tree li {
    padding: 0.5em;
    text-align: center;
}

#action-buttons button {
    padding: 0.1rem 0.3rem;
    text-transform: none;
}
</style>
