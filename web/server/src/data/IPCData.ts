import * as Stratum from "../../../common/Stratum";
import * as AnnealNode from "../../../common/AnnealNode";
import * as Constraint from "../../../common/Constraint";
import * as RecordData from "../../../common/RecordData";
import * as ConstraintSatisfaction from "../../../common/ConstraintSatisfaction";
import { MoveRecordTestPermutationOperationInfo, SwapRecordsTestPermutationOperationInfo } from "../../../common/ToServerSatisfactionTestPermutationRequest";

interface InternalAnnealMeta {
    redisResponseId: string,
}

interface InternalAnnealNodeMeta {
    annealNode: {
        id: string,
        index: number,
    }
}

export interface AnnealJobData {
    _meta: InternalAnnealMeta & InternalAnnealNodeMeta,

    recordData: RecordData.Desc,
    annealNode: AnnealNode.NodeRoot,
    strata: ReadonlyArray<Stratum.Desc>,
    constraints: ReadonlyArray<Constraint.Desc>,
}

export interface AnnealResultMessageData {
    _meta: InternalAnnealMeta & InternalAnnealNodeMeta,

    result?: {
        tree: AnnealNode.NodeRoot,
        satisfaction: ConstraintSatisfaction.SatisfactionMap,
    },
    error?: string,
}

export interface AnnealResponseMessageData {
    _meta: InternalAnnealMeta,

    results?: AnnealResultMessageData[],
    error?: string,
}

export interface SatisfactionCalculationJobData {
    recordData: RecordData.Desc,
    annealNodes: ReadonlyArray<AnnealNode.NodeRoot>,
    strata: ReadonlyArray<Stratum.Desc>,
    constraints: ReadonlyArray<Constraint.Desc>,
}

export interface TestPermutationMoveRecordJobData {
    recordData: RecordData.Desc,
    annealNodes: ReadonlyArray<AnnealNode.NodeRoot>,
    strata: ReadonlyArray<Stratum.Desc>,
    constraints: ReadonlyArray<Constraint.Desc>,
    operation: MoveRecordTestPermutationOperationInfo,
}

export interface TestPermutationSwapRecordsJobData {
    recordData: RecordData.Desc,
    annealNodes: ReadonlyArray<AnnealNode.NodeRoot>,
    strata: ReadonlyArray<Stratum.Desc>,
    constraints: ReadonlyArray<Constraint.Desc>,
    operation: SwapRecordsTestPermutationOperationInfo,
}
