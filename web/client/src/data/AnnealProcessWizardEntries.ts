import { WizardNavigationEntry as WNE } from "../data/WizardNavigationEntry";

import { AnnealCreator as S } from "../store";

// These currently undefined variable placeholders are used in the entries
// objects below to refer to each other at runtime
export let
    importData: WNE,
    reviewRecords: WNE,
    selectIdColumn: WNE,
    poolRecords: WNE,
    designGroupStructure: WNE,
    configureGroups: WNE,
    configureConstraints: WNE,
    runAnneal: WNE,
    exportData: WNE;

/**
 * Contains all entries for the anneal process wizard
 */
export const entries: ReadonlyArray<Readonly<WNE>> = [
    importData = {
        label: () => {
            // If file already loaded, use that file name
            if (S.get(S.getter.HAS_SOURCE_FILE_DATA)) {
                return `${S.state.recordData.source.name}`;
            }

            return "Import";
        },
        name: "anneal-import-data",
        disabled: () => {
            return !(
                // Disable when processing request
                !S.get(S.getter.IS_ANNEAL_REQUEST_IN_PROGRESS)
            );
        },

        next: () => reviewRecords,
    },
    reviewRecords = {
        label: "Review record data",
        name: "anneal-review-records",
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
        name: "anneal-select-id-column",
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
        next: () => poolRecords,
    },
    poolRecords = {
        label: "Pool records",
        name: "anneal-pool-records",
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
        name: "anneal-define-group-structure",
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
        name: "anneal-configure-groups",
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
        name: "anneal-set-constraints",
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
        name: "anneal-run-anneal",
        disabled: () => {
            return !(
                // Enable when there is config + source file data
                S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA)
            );
        },
    },
    exportData = {
        label: "Export configuration",
        name: "anneal-export-data",
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
