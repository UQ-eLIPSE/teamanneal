import { AnnealResponse } from "./AnnealResponse";

export type AnnealRequestState =
    AnnealRequestProgress_NotRunning |
    AnnealRequestProgress_InProgress |
    AnnealRequestProgress_Completed;

export interface AnnealRequestProgress_NotRunning {
    type: "not-running",
}

export interface AnnealRequestProgress_InProgress {
    type: "in-progress",

    /** Timestamp of last progress update */
    lastUpdated: number,
}

export interface AnnealRequestProgress_Completed {
    type: "completed",
    response: AnnealResponse,
}

export function initNotRunning() {
    const obj: AnnealRequestProgress_NotRunning = {
        type: "not-running",
    };

    return obj;
}

export function initInProgress(lastUpdated: number = Date.now()) {
    const obj: AnnealRequestProgress_InProgress = {
        type: "in-progress",
        lastUpdated,
    };

    return obj;
}

export function initCompleted(response: AnnealResponse) {
    const obj: AnnealRequestProgress_Completed = {
        type: "completed",
        response,
    };

    return obj;
}

export function isNotRunning(annealRequestState: AnnealRequestState): annealRequestState is AnnealRequestProgress_NotRunning {
    return annealRequestState.type === "not-running";
}

export function isInProgress(annealRequestState: AnnealRequestState): annealRequestState is AnnealRequestProgress_InProgress {
    return annealRequestState.type === "in-progress";
}

export function isCompleted(annealRequestState: AnnealRequestState): annealRequestState is AnnealRequestProgress_Completed {
    return annealRequestState.type === "completed";
}
