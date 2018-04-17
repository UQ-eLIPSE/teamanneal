import { Vue, Trait } from "av-ts";

import { WizardNavigationEntry } from "../data/WizardNavigationEntry";

@Trait
export class AnnealProcessWizardPanel extends Vue {
    // We assert that `thisWizardStep` will be definitely assigned at runtime
    readonly thisWizardStep!: WizardNavigationEntry;
    showHelp: boolean = false;

    /**
     * Method to allow subclasses to also provide their own code for
     * preventing the navigation "next" button to be enabled
     */
    _isWizardNavNextDisabled(): boolean {
        return false;
    }

    emitWizardNavNext() {
        // Don't go if next is disabled
        if (this.isWizardNavNextDisabled) {
            return;
        }

        this.$emit("wizardNavigation", {
            event: "next",
        });
    }

    get isWizardNavNextDisabled() {
        // If the overridden method indicates that the nav button is disabled,
        // return true (button is disabled)
        if (this._isWizardNavNextDisabled()) { return true; }

        // Check if we have a next step defined
        if (this.thisWizardStep.next === undefined) { return false; }

        // Get the next step
        const next = this.thisWizardStep.next();

        // Get the disabled check function or say it is not disabled if the
        // function does not exist
        if (next.disabled === undefined) { return false; }
        const disabled = next.disabled();

        return disabled;
    }

    toggleHelp() {
        return this.showHelp = !this.showHelp;
    }
}
