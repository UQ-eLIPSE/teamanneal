/*
 * PendingResultCollationStore
 * 
 * Stores anneal results temporarily while remaining anneal nodes complete rest 
 * of request
 */
import * as IPCData from "./IPCData";

interface PendingResultCollationStoreData {
    expectedNumberOfResults: number,
    results: IPCData.AnnealResultMessageData[],
}

const store = new Map<number, PendingResultCollationStoreData>();

/**
 * Adds response object into store.
 * 
 * @param {number} id Server response ID associated with anneal job
 */
export function add(id: number, expectedNumberOfResults: number) {
    // Check that slot has not been used
    if (store.get(id) !== undefined) {
        throw new Error(`Slot ${id} is in use`);
    }

    const data: PendingResultCollationStoreData = {
        expectedNumberOfResults,
        results: [],
    }

    store.set(id, data);
}

/**
 * Gets the response object stored at the slot of given ID.
 * 
 * @param {number} id Server response ID associated with anneal job
 */
export function get(id: number) {
    return store.get(id);
}

/**
 * Removes response object from store.
 * 
 * @param {number} id Server response ID associated with anneal job
 */
export function remove(id: number) {
    return store.delete(id);
}
