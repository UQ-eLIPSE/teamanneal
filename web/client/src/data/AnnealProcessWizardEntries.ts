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
        className: "spacer-top",
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
            return !(
                // Disabled when there is no source file data
                S.get(S.getter.HAS_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
        warning: () => {
            // Warn when duplicate column names present
            return S.get(S.getter.HAS_DUPLICATE_COLUMN_NAMES);
        },
        next: () => selectIdColumn,
    },
    selectIdColumn = {
        label: "Select ID column",
        path: "/anneal/select-id-column",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
        warning: () => {
            // Warn when ID column index not set
            return !S.get(S.getter.HAS_VALID_ID_COLUMN_INDEX);
        },
        next: () => selectPartitionColumn,
    },
    selectPartitionColumn = {
        label: "Select partition column",
        path: "/anneal/select-partition-column",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
        warning: () => {
            // Warn when partition column is invalid
            return !S.get(S.getter.HAS_VALID_PARTITION_COLUMN);
        },
        next: () => designGroupStructure,
    },
    designGroupStructure = {
        label: "Define group structure",
        path: "/anneal/define-group-structure",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
        warning: () => {
            // Warn when strata not valid or config names not valid
            return (
                !S.get(S.getter.HAS_STRATA) ||
                !S.get(S.getter.IS_STRATA_CONFIG_NAMES_VALID)
            );
        },
        next: () => configureGroups,
    },
    configureGroups = {
        label: "Configure groups",
        path: "/anneal/configure-groups",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
        warning: () => {
            // Warn when strata sizes invalid
            return !S.get(S.getter.IS_STRATA_CONFIG_SIZES_VALID);
        },
        next: () => configureConstraints,
    },
    configureConstraints = {
        label: "Set constraints",
        path: "/anneal/set-constraints",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
        warning: () => {
            // Warn when no constraints set or constraints invalid
            return (
                !S.get(S.getter.HAS_CONSTRAINTS) ||
                !S.get(S.getter.ARE_ALL_CONSTRAINTS_VALID)
            );
        },
        next: () => runAnneal,
    },
    runAnneal = {
        label: "Run anneal",
        path: "/anneal/run-anneal",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
    },
    exportData = {
        label: "Export configuration",
        path: "/anneal/export-data",
        className: "spacer-top",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA) &&

                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },
    },
];
