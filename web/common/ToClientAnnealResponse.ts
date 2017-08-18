import * as AnnealNode from "./AnnealNode";

interface OutputResult {
    readonly result?: AnnealNode.NodeRoot,
    readonly error?: any,
}

export interface Root {
    readonly results?: ReadonlyArray<OutputResult>,
    readonly error?: any,
}
