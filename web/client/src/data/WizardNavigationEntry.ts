export interface WizardNavigationEntry {
    label: string,
    path: string,
    disabled?: (state?: any) => boolean,

    next?: (state?: any) => WizardNavigationEntry,
}

