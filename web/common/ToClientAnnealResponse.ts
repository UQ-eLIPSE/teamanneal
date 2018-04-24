import * as AnnealNode from "./AnnealNode";
import * as ConstraintSatisfaction from "./ConstraintSatisfaction";
import { AnnealStatus } from "../common/AnnealStatus";

interface OutputResult {
    readonly result?: {
        tree: AnnealNode.NodeRoot,
        satisfaction: ConstraintSatisfaction.SatisfactionMap,
    },
    readonly error?: string,
}

export interface Root {
    readonly status: AnnealStatus,
    readonly results?: ReadonlyArray<OutputResult>,
    readonly error?: string,
}
