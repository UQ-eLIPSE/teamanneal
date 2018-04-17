import { WizardNavigationEntry as WNE } from "../data/WizardNavigationEntry";

import { AnnealCreator as S } from "../store";

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
        label: () => {
            if (S.get(S.getter.HAS_SOURCE_FILE_DATA)) {
                return `${S.state.recordData.source.name}`;
            } else {
                return "Select records file";
            }
        },
        path: "/anneal/provide-records-file",
        disabled: () => {
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
        disabled: () => {
            // Disabled when there is no source file data
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => selectIdColumn,
    },
    selectIdColumn = {
        label: "Select ID column",
        path: "/anneal/select-id-column",
        disabled: () => {
            // Disabled when there is no source file data
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state) &&

                // Disable if duplicate column names encountered
                !S.get(S.getter.HAS_DUPLICATE_COLUMN_NAMES)
            );
        },

        next: () => selectPartitionColumn,
    },
    selectPartitionColumn = {
        label: "Select partition column",
        path: "/anneal/select-partition-column",
        disabled: () => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&
                S.get(S.getter.HAS_VALID_ID_COLUMN_INDEX) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => designGroupStructure,
    },
    designGroupStructure = {
        label: "Define group structure",
        path: "/anneal/define-group-structure",
        disabled: () => {
            // Disabled when there is no ID column selected (a number above -1)
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&
                S.get(S.getter.HAS_VALID_ID_COLUMN_INDEX) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => configureGroups,
    },
    configureGroups = {
        label: "Configure groups",
        path: "/anneal/configure-groups",
        disabled: () => {
            // Disabled when there are no strata (output groups)
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&
                S.get(S.getter.HAS_VALID_ID_COLUMN_INDEX) &&
                S.get(S.getter.HAS_STRATA) &&
                S.get(S.getter.IS_STRATA_CONFIG_NAMES_VALID) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => configureConstraints,
    },
    configureConstraints = {
        label: "Set constraints",
        path: "/anneal/set-constraints",
        disabled: () => {
            // Disabled when there are no strata (output groups)
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&
                S.get(S.getter.HAS_VALID_ID_COLUMN_INDEX) &&
                S.get(S.getter.HAS_STRATA) &&
                S.get(S.getter.IS_STRATA_CONFIG_NAMES_VALID) &&
                S.get(S.getter.IS_STRATA_CONFIG_SIZES_VALID) &&

                // Disable when processing request
                !State.IsAnnealRequestInProgress(state)
            );
        },

        next: () => viewResult,
    },
    viewResult = {
        label: "View result",
        path: "/anneal/view-result",
        disabled: () => {
            // Disabled when there are no strata (output groups)
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&
                S.get(S.getter.HAS_VALID_ID_COLUMN_INDEX) &&
                S.get(S.getter.HAS_STRATA) &&
                S.get(S.getter.IS_STRATA_CONFIG_NAMES_VALID) &&
                S.get(S.getter.IS_STRATA_CONFIG_SIZES_VALID) &&

                // Enable only when the anneal request is actually created
                State.IsAnnealRequestCreated(state)
            );
        },
    }
];
