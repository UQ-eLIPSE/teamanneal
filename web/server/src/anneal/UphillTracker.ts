import * as SlidingWindow from "../data/SlidingWindow";

export interface UphillTracker {
    readonly probabilityHistory: SlidingWindow.SlidingWindow<number>,
    readonly accepted: number,
    readonly rejected: number,
}

interface UphillTrackerUnsafe {
    probabilityHistory: SlidingWindow.SlidingWindow<number>,
    accepted: number,
    rejected: number,
}

const defaultAvgProbabilityWindowSize: number = 8;

/** 
 * This is a reference prototype so that some JavaScript engines can better
 * optimise property lookups against all UphillTrackers.
 * 
 * This seems to be particularly true of V8 (Chrome/Node.js).
 */
const __rootPrototype = Object.create(null);

export function init() {
    const ut: UphillTrackerUnsafe = Object.create(__rootPrototype);

    // Prefill sliding window with 1s
    ut.probabilityHistory = SlidingWindow.init<number>(defaultAvgProbabilityWindowSize, 1);
    ut.accepted = 0;
    ut.rejected = 0;

    return ut as UphillTracker;
}

export function incrementAccept(uphillTracker: UphillTracker) {
    const ut = uphillTracker as UphillTrackerUnsafe;
    ut.accepted++;
    return ut as UphillTracker;
}

export function incrementReject(uphillTracker: UphillTracker) {
    const ut = uphillTracker as UphillTrackerUnsafe;
    ut.rejected++;
    return ut as UphillTracker;
}

export function getAcceptanceProbability(uphillTracker: UphillTracker) {
    const ut = uphillTracker;

    if (ut.accepted === 0) {
        return 0;
    }

    return ut.accepted / (ut.accepted + ut.rejected);
}

export function getProbabilityHistoryAverage(uphillTracker: UphillTracker) {
    const ut = uphillTracker;

    return SlidingWindow.avg(ut.probabilityHistory);
}

export function updateProbabilityHistory(uphillTracker: UphillTracker) {
    const ut = uphillTracker;

    SlidingWindow.push(ut.probabilityHistory, getAcceptanceProbability(ut));

    return getProbabilityHistoryAverage(ut);
}

export function resetAcceptReject(uphillTracker: UphillTracker) {
    const ut = uphillTracker as UphillTrackerUnsafe;

    ut.accepted = 0;
    ut.rejected = 0;

    return ut as UphillTracker;
}
