import { State, Data as IState } from "../data/State";
import * as WizardNavigationEntry from "../data/WizardNavigationEntry";

type WNE = WizardNavigationEntry.WizardNavigationEntry;

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
        label: (state: IState) => {
            if (State.hasSourceFileData(state)) {
                return `${state.recordData.source.name}`;
            } else {
                return "Select records file";
            }
        },
        path: "/anneal/provide-records-file",
        disabled: (state: IState) => {
            return !(
                // Disable when processing request
                !State.isAnnealRequestInProgress(state)
            );
        },

        next: () => reviewRecords,
    },
    reviewRecords = {
        label: "Review data",
        path: "/anneal/review-records",
        disabled: (state: IState) => {
            // Disabled when there is no source file data
            return !(
                State.hasSourceFileData(state) &&

                // Disable when processing request
                !State.isAnnealRequestInProgress(state)
            );
        },

        next: () => selectIdColumn,
    },
    selectIdColumn = {
        label: "Select ID column",
        path: "/anneal/select-id-column",
        disabled: (state: IState) => {
            // Disabled when there is no source file data
            return !(
                State.hasSourceFileData(state) &&

                // Disable when processing request
                !State.isAnnealRequestInProgress(state)
            );
        },

        next: () => selectPartitionColumn,
    },
    selectPartitionColumn = {
        label: "Select partition column",
        path: "/anneal/select-partition-column",
        disabled: (state: IState) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                State.hasSourceFileData(state) &&
                State.hasValidIdColumnIndex(state) &&

                // Disable when processing request
                !State.isAnnealRequestInProgress(state)
            );
        },

        next: () => designGroupStructure,
    },
    designGroupStructure = {
        label: "Define group structure",
        path: "/anneal/define-group-structure",
        disabled: (state: IState) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                State.hasSourceFileData(state) &&
                State.hasValidIdColumnIndex(state) &&

                // Disable when processing request
                !State.isAnnealRequestInProgress(state)
            );
        },

        next: () => configureGroups,
    },
    configureGroups = {
        label: "Configure groups",
        path: "/anneal/configure-groups",
        disabled: (state: IState) => {
            // Disabled when there are no strata (output groups)
            return !(
                State.hasSourceFileData(state) &&
                State.hasValidIdColumnIndex(state) &&
                State.hasStrata(state) &&
                State.isStrataConfigNamesValid(state) &&

                // Disable when processing request
                !State.isAnnealRequestInProgress(state)
            );
        },

        next: () => configureConstraints,
    },
    configureConstraints = {
        label: "Set constraints",
        path: "/anneal/set-constraints",
        disabled: (state: IState) => {
            // Disabled when there are no strata (output groups)
            return !(
                State.hasSourceFileData(state) &&
                State.hasValidIdColumnIndex(state) &&
                State.hasStrata(state) &&
                State.isStrataConfigNamesValid(state) &&
                State.isStrataConfigSizesValid(state) &&

                // Disable when processing request
                !State.isAnnealRequestInProgress(state)
            );
        },

        next: () => viewResult,
    },
    viewResult = {
        label: "View result",
        path: "/anneal/view-result",
        disabled: (state: IState) => {
            // Disabled when there are no strata (output groups)
            return !(
                State.hasSourceFileData(state) &&
                State.hasValidIdColumnIndex(state) &&
                State.hasStrata(state) &&
                State.isStrataConfigNamesValid(state) &&
                State.isStrataConfigSizesValid(state) &&

                // Enable only when the anneal request is actually created
                State.isAnnealRequestCreated(state)
            );
        },
    },
];
