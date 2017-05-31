import * as WizardNavigationEntry from "../data/WizardNavigationEntry";
import * as TeamAnnealState from "../data/TeamAnnealState";

type WNE = WizardNavigationEntry.WizardNavigationEntry;
type TAState = Partial<TeamAnnealState.TeamAnnealState>;

// These currently undefined variable placeholders are used in the entries
// objects below to refer to each other at runtime
export let
    provideRecordsFile: WNE,
    reviewRecords: WNE,
    selectIdColumn: WNE,
    selectPartitionColumn: WNE,
    configureOutputGroups: WNE,
    configureConstraints: WNE;

/**
 * Contains all entries for the anneal process wizard
 */
export const entries: ReadonlyArray<Readonly<WNE>> = [
    provideRecordsFile = {
        label: "Select records file",
        path: "/anneal/provide-records-file",

        next: () => reviewRecords,
    },
    reviewRecords = {
        label: "Double check data",
        path: "/anneal/review-records",
        disabled: (state: TAState) => {
            // Disabled when there is no source file data
            return !(
                TeamAnnealState.hasSourceFileData(state)
            )
        },

        next: () => selectIdColumn,
    },
    selectIdColumn = {
        label: "Select ID column",
        path: "/anneal/select-id-column",
        disabled: (state: TAState) => {
            // Disabled when there is no source file data
            return !(
                TeamAnnealState.hasSourceFileData(state)
            )
        },

        next: () => selectPartitionColumn,
    },
    selectPartitionColumn = {
        label: "Select partition column",
        path: "/anneal/select-partition-column",
        disabled: (state: TAState) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                TeamAnnealState.hasSourceFileData(state) &&
                TeamAnnealState.hasValidIdColumnIndex(state)
            );
        },

        next: () => configureOutputGroups,
    },
    configureOutputGroups = {
        label: "Configure output groups",
        path: "/anneal/configure-output-groups",
        disabled: (state: TAState) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                TeamAnnealState.hasSourceFileData(state) &&
                TeamAnnealState.hasValidIdColumnIndex(state)
            );
        },

        next: () => configureConstraints,
    },
    configureConstraints = {
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
