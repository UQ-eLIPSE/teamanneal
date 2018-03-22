import { State, Data as IState } from "../data/State";
import * as WizardNavigationEntry from "../data/WizardNavigationEntry";

type WNE = WizardNavigationEntry.WizardNavigationEntry<IState>;

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
    viewResult: WNE,
    modifyResult: WNE;

/**
 * Contains all entries for the anneal process wizard
 */
export const entries: ReadonlyArray<Readonly<WNE>> = [
    provideRecordsFile = {
        label: (state) => {
            if (State.HasSourceFileData(state)) {
                return `${state.recordData.source.name}`;
            } else {
                return "Select records file";
            }
        },
        path: "/anneal/provide-records-file",
        disabled: (state) => {
            return !(
                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => reviewRecords,
    },
    reviewRecords = {
        label: "Review data",
        path: "/anneal/review-records",
        disabled: (state) => {
            // Disabled when there is no source file data
            return !(
                State.HasSourceFileData(state) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => selectIdColumn,
    },
    selectIdColumn = {
        label: "Select ID column",
        path: "/anneal/select-id-column",
        disabled: (state) => {
            // Disabled when there is no source file data
            return !(
                State.HasSourceFileData(state) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state) &&

                //Disable if duplicate column names encountered
                !State.HasDuplicateColumnNames(state)
            );
        },

        next: () => selectPartitionColumn,
    },
    selectPartitionColumn = {
        label: "Select partition column",
        path: "/anneal/select-partition-column",
        disabled: (state) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                State.HasSourceFileData(state) &&
                State.HasValidIdColumnIndex(state) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => designGroupStructure,
    },
    designGroupStructure = {
        label: "Define group structure",
        path: "/anneal/define-group-structure",
        disabled: (state) => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                State.HasSourceFileData(state) &&
                State.HasValidIdColumnIndex(state) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => configureGroups,
    },
    configureGroups = {
        label: "Configure groups",
        path: "/anneal/configure-groups",
        disabled: (state) => {
            // Disabled when there are no strata (output groups)
            return !(
                State.HasSourceFileData(state) &&
                State.HasValidIdColumnIndex(state) &&
                State.HasStrata(state) &&
                State.IsStrataConfigNamesValid(state) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => configureConstraints,
    },
    configureConstraints = {
        label: "Set constraints",
        path: "/anneal/set-constraints",
        disabled: (state) => {
            // Disabled when there are no strata (output groups)
            return !(
                State.HasSourceFileData(state) &&
                State.HasValidIdColumnIndex(state) &&
                State.HasStrata(state) &&
                State.IsStrataConfigNamesValid(state) &&
                State.IsStrataConfigSizesValid(state) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => viewResult,
    },
    viewResult = {
        label: "View result",
        path: "/anneal/view-result",
        disabled: (state) => {
            // Disabled when there are no strata (output groups)
            return !(
                State.HasSourceFileData(state) &&
                State.HasValidIdColumnIndex(state) &&
                State.HasStrata(state) &&
                State.IsStrataConfigNamesValid(state) &&
                State.IsStrataConfigSizesValid(state) &&

                // Enable only when the anneal request is actually created
                State.IsAnnealRequestCreated(state)
            );
        },
    },
    modifyResult = {
        label: "Modify result",
        path: "/anneal/modify-result",
        disabled: (_state) => {
            // NOTE: Currently returning `false` during development
            // TODO: Actually disable as appropriate
            return false;
        },
    },
];
