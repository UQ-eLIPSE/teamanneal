import * as Record from "../../../common/Record";
import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";

import * as Stratum from "./Stratum";
import * as Partition from "./Partition";
import * as ColumnInfo from "./ColumnInfo";
import * as SourceFile from "./SourceFile";
import * as ConstraintsConfig from "./ConstraintsConfig";

import { ResultArrayNode } from "./AnnealAjax";
import { AxiosError, AxiosPromise, CancelTokenSource } from "axios";

type ResultArrayContent = ResultArray | Record.RecordSet;
export interface ResultArray extends ReadonlyArray<ResultArrayContent> { }
export type AnnealOutput = ReadonlyArray<ResultArray>;

export interface TeamAnnealState {
    anneal: {
        ajaxRequest: AxiosPromise | undefined,
        ajaxCancelTokenSource: CancelTokenSource | undefined,

        input: ToServerAnnealRequest.Root | undefined,
        output: AnnealOutput | undefined,
        outputTree: ResultArrayNode | undefined,
        outputSatisfaction: undefined,      // TODO: Not yet implemented
        outputIdNodeMap: Map<string, ReadonlyArray<ResultArrayNode>> | undefined,
        outputError: AxiosError | undefined,
    }

    sourceFile: Partial<SourceFile.SourceFile>,
    constraintsConfig: ConstraintsConfig.ConstraintsConfig,
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

export function hasConstraints(state: Partial<TeamAnnealState>) {
    return (
        state.constraintsConfig &&
        state.constraintsConfig.constraints &&
        state.constraintsConfig.constraints.length > 0
    );
}

export function isStrataConfigNamesValid(state: Partial<TeamAnnealState>) {
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

export function isStrataConfigSizesValid(state: Partial<TeamAnnealState>) {
    if (state.constraintsConfig === undefined ||
        state.sourceFile === undefined) {
        return false;
    }

    const strata = state.constraintsConfig.strata;

    if (strata === undefined) { return false; }

    // All stratum sizes must be valid
    for (let i = 0; i < strata.length; ++i) {
        const stratum = strata[i];

        // Run validity checks
        if (
            // Values must be integers
            Stratum.isSizeMinNotUint32(stratum) ||
            Stratum.isSizeIdealNotUint32(stratum) ||
            Stratum.isSizeMaxNotUint32(stratum) ||

            // Must be min <= ideal <= max
            Stratum.isSizeMinGreaterThanIdeal(stratum) ||
            Stratum.isSizeIdealGreaterThanMax(stratum) ||

            // Not permitted for min to equal max
            Stratum.isSizeMinEqualToMax(stratum) ||

            // Minimum is always 1
            Stratum.isSizeMinLessThanOne(stratum)
        ) {
            return false;
        }
    }

    // Check that group size calculations are possible over all partitions
    const cookedData = state.sourceFile.cookedData!;
    const columnInfo = state.sourceFile.columnInfo!;
    const partitionColumnIndex = state.constraintsConfig.partitionColumnIndex;

    let partitioningColumnInfo: ColumnInfo.ColumnInfo | undefined;

    if (partitionColumnIndex === undefined) {
        partitioningColumnInfo = undefined;
    } else {
        partitioningColumnInfo = columnInfo[partitionColumnIndex];
    }

    const partitions = Partition.createPartitions(cookedData, partitioningColumnInfo);

    try {
        partitions.forEach((partition) => {
            // Attempt group sizes for each partition
            const numberOfRecordsInPartition = partition.length;
            return Stratum.generateStrataGroupSizes(strata, numberOfRecordsInPartition);
        });
    } catch (e) {
        // Group size calculations failed
        return false;
    }

    // Otherwise we're good to go
    return true;
}

export function isAnnealRequestInProgress(state: Partial<TeamAnnealState>) {
    return (
        state.anneal &&
        state.anneal.input &&                   // Has an input anneal request
        state.anneal.ajaxCancelTokenSource &&   // Has a cancel token set up
        !state.anneal.output &&                 // But doesn't have a output or error yet
        !state.anneal.outputError
    );
}

export function isAnnealRequestCreated(state: Partial<TeamAnnealState>) {
    return (
        state.anneal &&
        state.anneal.ajaxCancelTokenSource
    );
}

export function isAnnealSuccessful(state: Partial<TeamAnnealState>) {
    return (
        state.anneal &&
        state.anneal.output &&
        !state.anneal.outputError
    );
}
