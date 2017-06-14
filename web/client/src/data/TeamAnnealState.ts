import * as Record from "../../../common/Record";
import * as SourceFile from "./SourceFile";
import * as ConstraintsConfig from "./ConstraintsConfig";

type ResultArrayContent = ResultArray | Record.RecordSet;
export interface ResultArray extends ReadonlyArray<ResultArrayContent> { }

export interface TeamAnnealState {
    routerFullPath: string,

    anneal: {
        input: undefined,                   // TODO: Not yet implemented
        output: ReadonlyArray<ResultArray> | undefined,
        outputSatisfaction: undefined,      // TODO: Not yet implemented
    }

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
