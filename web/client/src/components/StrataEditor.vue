<template>
    <div>
        <div id="tree">
            <ul>
                <li v-for="(stratum, i) in strata">
                    <StrataEditorStratumItem :key="stratum._id"
                                             :stratum="stratum"
                                             :childUnit="strata[i+1] ? strata[i+1].label : 'person'"
                                             @change="onStratumItemChange" />
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
