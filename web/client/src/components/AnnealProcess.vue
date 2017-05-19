<template>
    <div>
        <!--<transition name="fade"><SpreadsheetView v-if="isSpreadsheetVisible" /></transition>-->
        <div id="wizard-container" :class="{ splash: isWizardContainerSplash, float: isWizardContainerFloating, }">
            <router-view class="wizard-inside-container" />
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import SpreadsheetView from "./SpreadsheetView.vue";

@Component({
    components: {
        SpreadsheetView,
    },
})
export default class AnnealProcess extends Vue {
    wizardContainerFloat: boolean = true;
    spreadsheetVisible: boolean = false;

    get isWizardContainerFloating() {
        return this.wizardContainerFloat;
    }

    get isWizardContainerSplash() {
        return !this.wizardContainerFloat;
    }

    get isSpreadsheetVisible() {
        return this.$store.state.csvFileData !== undefined;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#wizard-container {
    padding: 3rem;

    position: relative;
    z-index: 1;

    pointer-events: none;

    opacity: 1;

    transition: all 250ms ease-out;
}

#wizard-container.splash {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    display: flex;
    flex-direction: row;

    align-items: center;
    justify-content: center;
}

#wizard-container.float {
    position: absolute;
    bottom: 0;
    right: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity .25s
}

.fade-enter,
.fade-leave-to {
    opacity: 0
}
</style>
