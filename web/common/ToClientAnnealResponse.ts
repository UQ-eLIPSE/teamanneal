import * as AnnealNode from "./AnnealNode";
import * as ConstraintSatisfaction from "./ConstraintSatisfaction";
import { AnnealStatus } from "../common/AnnealStatus";

interface OutputResult {
    readonly result?: {
        tree: AnnealNode.NodeRoot,
        satisfaction: {
            satisfactionMap: ConstraintSatisfaction.SatisfactionMap,
            statistics: {[key: string]:ConstraintSatisfaction.MultipleSatisfactionStats}
        }
    },
    readonly error?: string,
}

export interface Root {
    readonly status: AnnealStatus,
    readonly results?: ReadonlyArray<OutputResult>,
    readonly error?: string,
}
