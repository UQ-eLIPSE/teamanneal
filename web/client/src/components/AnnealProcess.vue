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

import * as AnnealProcessWizardEntries from "../data/AnnealProcessWizardEntries";

import WizardNavigation from "./WizardNavigation.vue";


@Component({
    components: {
        WizardNavigation,
    },
})
export default class AnnealProcess extends Vue {
    processWizardEntries = AnnealProcessWizardEntries.entries;
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
    
    overflow-y: auto;
}

#wizard-content {
    flex-grow: 1;

    position: relative;

    background: #f2f2f2;

    /* Don't permit overflowing content in wizard,
       which would cause <body> to scroll */
    overflow-y: hidden;
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
