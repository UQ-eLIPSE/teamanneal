import * as AnnealNode from "./AnnealNode";
import * as ConstraintSatisfaction from "./ConstraintSatisfaction";

interface OutputResult {
    readonly result?: {
        tree: AnnealNode.NodeRoot,
        satisfaction: ConstraintSatisfaction.SatisfactionMap,
    },
    readonly error?: string,
}

export interface Root {
    readonly results?: ReadonlyArray<OutputResult>,
    readonly error?: string,
}
