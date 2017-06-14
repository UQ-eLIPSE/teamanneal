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
    designGroupStructure: WNE,
    configureGroups: WNE,
    configureConstraints: WNE,
    viewResult: WNE;

/**
 * Contains all entries for the anneal process wizard
 */
export const entries: ReadonlyArray<Readonly<WNE>> = [
    provideRecordsFile = {
        label: (state: TAState) => {
            if (TeamAnnealState.hasSourceFileData(state)) {
                return `${state.sourceFile!.name}`;
            } else {
                return "Select records file";
            }
        },
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

        next: () => designGroupStructure,
    },
    designGroupStructure = {
        label: "Design group structure",
        path: "/anneal/design-group-structure",
        disabled: (state: TAState) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                TeamAnnealState.hasSourceFileData(state) &&
                TeamAnnealState.hasValidIdColumnIndex(state)
            );
        },

        next: () => configureGroups,
    },
    configureGroups = {
        label: "Configure groups",
        path: "/anneal/configure-groups",
        disabled: (state: TAState) => {
            // Disabled when there are no strata (output groups)
            return !(
                TeamAnnealState.hasSourceFileData(state) &&
                TeamAnnealState.hasValidIdColumnIndex(state) &&
                TeamAnnealState.hasStrata(state)
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
    viewResult = {
        label: "View result",
        path: "/anneal/view-result",
        // disabled: (state: TAState) => {
        //     // Disabled when there are no strata (output groups)
        //     return !(
        //         TeamAnnealState.hasSourceFileData(state) &&
        //         TeamAnnealState.hasValidIdColumnIndex(state) &&
        //         TeamAnnealState.hasStrata(state)
        //     );
        // },
    },
];
