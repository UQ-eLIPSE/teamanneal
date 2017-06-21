<template>
    <div>
        <div class="group-structure">
            <ul>
                <li v-for="(stratum, i) in strata">
                    <StrataStructureEditorStratumItem :key="stratum._id"
                                                      :stratum="stratum"
                                                      :childUnit="strata[i+1] ? strata[i+1].label : 'person'"
                                                      :deletable="isStratumDeletable(i)"
                                                      @change="onStratumItemChange"
                                                      @delete="onStratumItemDelete" />
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

@Component({
    components: {
        StrataStructureEditorStratumItem,
    },
})
export default class StrataStructureEditor extends Vue {
    get strata() {
        return this.$store.state.constraintsConfig.strata!;
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
