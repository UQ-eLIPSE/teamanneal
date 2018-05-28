import { WizardNavigationEntry as WNE } from "../data/WizardNavigationEntry";

import { AnnealCreator as S } from "../store";

// These currently undefined variable placeholders are used in the entries
// objects below to refer to each other at runtime
export let
    welcome: WNE,
    importData: WNE,
    reviewRecords: WNE,
    selectIdColumn: WNE,
    selectPartitionColumn: WNE,
    designGroupStructure: WNE,
    configureGroups: WNE,
    configureConstraints: WNE,
    runAnneal: WNE,
    exportData: WNE;

/**
 * Contains all entries for the anneal process wizard
 */
export const entries: ReadonlyArray<Readonly<WNE>> = [
    welcome = {
        label: "Welcome",
        path: "/anneal/welcome",
        disabled: () => {
            return !(
                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
    },
    importData = {
        label: () => {
            // If file already loaded, use that file name
            if (S.get(S.getter.HAS_SOURCE_FILE_DATA)) {
                return `${S.state.recordData.source.name}`;
            }

            // Else we go and label it according to the import mode
            switch (S.state.dataImportMode) {
                case "new-records-file": return "Load data file";
                case "import-config-file-with-separate-records-file": return "Import existing configuration";
            }

            return "Import";
        },
        path: "/anneal/import-data",
        disabled: () => {
            return !(
                S.get(S.getter.HAS_DATA_IMPORT_MODE_SET) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
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
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
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
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS) &&

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
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
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
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
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
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
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
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },

        next: () => runAnneal,
    },
    runAnneal = {
        label: "Run anneal",
        path: "/anneal/run-anneal",
        disabled: () => {
            // Disabled when there are no strata (output groups) or constraints
            return !(
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&
                S.get(S.getter.HAS_VALID_ID_COLUMN_INDEX) &&
                S.get(S.getter.HAS_STRATA) &&
                S.get(S.getter.IS_STRATA_CONFIG_NAMES_VALID) &&
                S.get(S.getter.IS_STRATA_CONFIG_SIZES_VALID) &&
                S.get(S.getter.HAS_CONSTRAINTS)
            );
        },
    },
    exportData = {
        label: "Export configuration",
        path: "/anneal/export-data",
        disabled: () => {
            return !(
                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
    },
];
