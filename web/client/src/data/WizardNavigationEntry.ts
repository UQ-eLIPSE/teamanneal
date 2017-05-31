export interface WizardNavigationEntry {
    /** Label to appear in wizard step list */
    label: string,
    /** vue-router compatible global-level route path */
    path: string,
    /**
     * Function that returns whether the step should be disabled, depending on
     * a given state (expected to be delivered from the vuex store) 
     */
    disabled?: (state?: any) => boolean,

    /**
     * Function that returns the next step entry, depending on a given state
     * (expected to be delivered from the vuex store)
     */
    next?: (state?: any) => WizardNavigationEntry,
}

