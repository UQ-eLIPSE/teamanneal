<template>
    <div id="wizard-container">

        <!-- Display error message if browser is not compatible -->
        <div v-if="!isBrowserCompatible"
             class="header-message">
            Your browser does not support features required for TeamAnneal. Try using an up-to-date version of one of the following browsers:
            <ul>
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Microsoft Edge</li>
                <li>Apple Safari</li>
            </ul>
        </div>

        <div id="wizard-main">

            <div id="wizard-sidebar">
                <button class="button secondary exit-button"
                        @click="exitAnnealProcess">◀ Exit</button>
                <WizardNavigation class="wizard-navigation"
                                  :bus="wizardNavigationBus"
                                  :entries="processWizardEntries" />
            </div>
            <div id="wizard-content">
                <router-view class="wizard-subcomponent"
                             @wizardNavigation="onWizardNavigation" />
            </div>
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

    /**
     * Checks if browser is compatible through feature detection.
     */
    get isBrowserCompatible() {
        try {
            // Promise
            const promiseAvailable = typeof Promise === "function";

            // WeakMap
            const weakMapAvailable = typeof WeakMap === "function";

            // Object.assign()
            const objectAssignAvailable = typeof Object.assign === "function";

            return (
                promiseAvailable &&
                weakMapAvailable &&
                objectAssignAvailable
            );
        } catch (e) {
            return false;
        }
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
    flex-direction: column;
}

#wizard-main {
    display: flex;
    flex-direction: row;
    flex-basis: 100%;
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

.header-message {
    background-color: darkorange;
    padding: 1rem 1rem;
    flex-shrink: 0;
}

.header-message ul {
    margin: 0 0.5rem;
    padding: 0.5rem;
}
</style>
