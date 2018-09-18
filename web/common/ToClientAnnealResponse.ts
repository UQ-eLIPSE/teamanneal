import * as AnnealNode from "./AnnealNode";
import * as ConstraintSatisfaction from "./ConstraintSatisfaction";
import { AnnealStatus } from "../common/AnnealStatus";

export interface OutputResult {
    readonly result?: {
        tree: AnnealNode.NodeRoot,
        satisfaction: SatisfactionResponse
    },
    readonly error?: string,
}

export interface SatisfactionResponse {
    satisfactionMap: ConstraintSatisfaction.SatisfactionMap,
    statistics: { [constraintId: string]: ConstraintSatisfaction.MultipleSatisfactionStats }
}

export interface Root {
    readonly status: AnnealStatus,
    readonly results?: ReadonlyArray<OutputResult>,
    readonly error?: string,
}
