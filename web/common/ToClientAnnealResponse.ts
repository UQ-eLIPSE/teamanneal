import * as AnnealNode from "./AnnealNode";
import { AnnealStatus } from "../common/AnnealStatus";

interface OutputResult {
    readonly result?: AnnealNode.NodeRoot,
    readonly error?: string,
}

export interface Root {
    status: AnnealStatus,
    readonly results?: ReadonlyArray<OutputResult>,
    readonly error?: string,
}
