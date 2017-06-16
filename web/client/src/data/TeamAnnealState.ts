import * as SourceFile from "./SourceFile";
import * as ConstraintsConfig from "./ConstraintsConfig";

export interface TeamAnnealState {
    routerFullPath: string,

    sourceFile: Partial<SourceFile.SourceFile>,
    constraintsConfig: Partial<ConstraintsConfig.ConstraintsConfig>,
}

export function hasSourceFileData(state: Partial<TeamAnnealState>) {
    return (
        state.sourceFile &&
        state.sourceFile.rawData &&
        state.sourceFile.rawData.length > 0
    );
}

export function hasValidIdColumnIndex(state: Partial<TeamAnnealState>) {
    return (
        state.constraintsConfig &&
        typeof state.constraintsConfig.idColumnIndex === "number" &&
        state.constraintsConfig.idColumnIndex > -1
    );
}

export function hasStrata(state: Partial<TeamAnnealState>) {
    return (
        state.constraintsConfig &&
        state.constraintsConfig.strata &&
        state.constraintsConfig.strata.length > 0
    );
}

export function isStrataConfigValid(state: Partial<TeamAnnealState>) {
    if (state.constraintsConfig === undefined) { return false; }

    const strata = state.constraintsConfig.strata;

    if (strata === undefined) { return false; }

    const strataNameSet = new Set<string>();

    for (let i = 0; i < strata.length; ++i) {
        const stratum = strata[i];

        // We consider uniqueness regardless of case
        const label = stratum.label.trim().toLowerCase();

        // Do not permit blank string names
        if (label.length === 0) { return false; }

        strataNameSet.add(label);
    }

    // Do not permit non unique strata names
    if (strataNameSet.size !== strata.length) { return false; }

    // Otherwise we're good to go
    return true;
}
