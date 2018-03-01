import AnnealStatus from "./AnnealStatus";
import * as AnnealNode from "./AnnealNode";

export interface AnnealStatusState {
    workerId: string,
    status: AnnealStatus,
    timestamp: number,
    annealNode: AnnealNode.NodeRoot
}

export interface StatusMap {
    [key: string]: AnnealStatusState
}