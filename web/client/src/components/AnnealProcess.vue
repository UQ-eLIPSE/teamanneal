<template>
    <div id="wizard-container">
        <div id="wizard-sidebar">
            <button class="button secondary exit-button" @click="exitAnnealProcess">◀ Exit</button>
            <WizardNavigation class="wizard-navigation" :bus="wizardNavigationBus" :entries="processWizardEntries" />
        </div>
        <div id="wizard-content">
            <router-view class="wizard-subcomponent" @wizardNavigation="onWizardNavigation" />
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as WizardNavigationEntry from "../data/WizardNavigationEntry";
import * as TeamAnnealState from "../data/TeamAnnealState";

import WizardNavigation from "./WizardNavigation.vue";


type WNE = WizardNavigationEntry.WizardNavigationEntry;
type TAState = Partial<TeamAnnealState.TeamAnnealState>;


let step1: WNE,
    step2: WNE,
    step3: WNE,
    step4: WNE,
    step5: WNE,
    step6: WNE;

const wizardEntries: ReadonlyArray<Readonly<WNE>> = [
    step1 = {
        label: "Select records file",
        path: "/anneal/provide-records-file",
        next: () => step2,
        nextDisabled: () => false,
    },
    step2 = {
        label: "Double check data",
        path: "/anneal/review-records",
        disabled: (state: TAState) => {
            // Disabled when there is no source file data
            return !(
                TeamAnnealState.hasSourceFileData(state)
            )
        },

        next: () => step3,
        nextDisabled: () => false,
    },
    step3 = {
        label: "Select ID column",
        path: "/anneal/select-id-column",
        disabled: (state: TAState) => {
            // Disabled when there is no source file data
            return !(
                TeamAnnealState.hasSourceFileData(state)
            )
        },

        next: () => step4,
        nextDisabled: () => false,
    },
    step4 = {
        label: "Select partition column",
        path: "/anneal/select-partition-column",
        disabled: (state: TAState) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                TeamAnnealState.hasSourceFileData(state) &&
                TeamAnnealState.hasValidIdColumnIndex(state)
            );
        },

        next: () => step5,
        nextDisabled: () => false,
    },
    step5 = {
        label: "Configure output groups",
        path: "/anneal/configure-output-groups",
        disabled: (state: TAState) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                TeamAnnealState.hasSourceFileData(state) &&
                TeamAnnealState.hasValidIdColumnIndex(state)
            );
        },

        next: () => step6,
        nextDisabled: () => false,
    },
    step6 = {
        label: "Configure constraints",
        path: "/anneal/configure-constraints",
        disabled: (state: TAState) => {
            // Disabled when there are no strata (output groups)
            return !(
                TeamAnnealState.hasSourceFileData(state) &&
                TeamAnnealState.hasValidIdColumnIndex(state) &&
                TeamAnnealState.hasStrata(state)
            );
        },
    },
];





@Component({
    components: {
        WizardNavigation,
    }
})
export default class AnnealProcess extends Vue {
    processWizardEntries = wizardEntries;
    wizardNavigationBus = new Vue();

    exitAnnealProcess() {
        this.$router.push({
            path: "/",
        });
    }

    onWizardNavigation(data: any) {
        this.wizardNavigationBus.$emit("wizardNavigation", data);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#wizard-container {
    display: flex;

    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    flex-direction: row;
}

#wizard-sidebar {
    flex-grow: 0;
    flex-shrink: 0;

    width: 20rem;

    color: #49075e;
    background: rgb(230, 230, 230);

    box-shadow: inset -1rem 0 1rem rgba(0, 0, 0, 0.1);
}

#wizard-content {
    flex-grow: 1;

    position: relative;

    background: #f2f2f2;
}

.wizard-subcomponent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    font-weight: 300;
}

.exit-button {
    margin: 1em;
    padding: 0.6em 1em;
}
</style>
