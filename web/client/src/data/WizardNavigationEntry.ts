export interface WizardNavigationEntry {
    /** Label to appear in wizard step list */
    label: string | (() => string),

    /** vue-router compatible global-level route name */
    name: string,

    /** Optional classes to apply to <li> element */
    className?: string,

    /**
     * Function that returns whether the step should be disabled, depending on
     * a given state (expected to be delivered from the vuex store) 
     */
    disabled?: () => boolean,

    /**
     * Function that returns the next step entry, depending on a given state
     * (expected to be delivered from the vuex store)
     */
    next?: () => WizardNavigationEntry,

    /**
     * Function that returns whether to display a warning icon next to the
     * navigation entry
     */
    warning?: () => boolean,
}

