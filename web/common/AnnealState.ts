import AnnealStatus from "./AnnealStatus";
import * as AnnealNode from "./AnnealNode";

export interface AnnealStatusState {
    workerId: string,
    status: AnnealStatus,
    timestamp: number,
    annealNode: AnnealNode.NodeRoot
}

/**
 * Lightweight interface to return responses when anneal status is queried
 */
export interface AnnealStatusResponseState {
    workerId: string,
    status: AnnealStatus,
    timestamp: number,
}

export interface StatusMap {
    [key: string]: AnnealStatusResponseState
}