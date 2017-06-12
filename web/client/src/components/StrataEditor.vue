<template>
    <div>
        <div id="tree">
            <ul>
                <li v-for="(stratum, i) in strata">
                    <StrataEditorStratumItem :key="stratum._id" @change="onStratumItemChange" :stratum="stratum" :childUnit="strata[i+1] ? strata[i+1].label : 'person'" />
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

@Component({
    components: {
        StrataEditorStratumItem,
    },
})
export default class StrataEditor extends Vue {
    get strata() {
        return this.$store.state.constraintsConfig.strata!;
    }

    onStratumItemChange(stratumUpdate: Stratum.Update) {
        this.$store.commit("updateConstraintsConfigStrata", stratumUpdate);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#tree {
    background: rgba(0, 0, 0, 0.05);

    width: 100%;
    height: auto;

    /*max-height: 10em;
    overflow-y: auto;*/
    font-size: 1.5em;
}

#tree ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

#tree li {
    padding: 0.5em;
}

#action-buttons button {
    padding: 0.1rem 0.3rem;
    text-transform: none;
}
</style>
