/*
 * PendingResponseStore
 * 
 * Stores Express response objects, for the purposes of responding to requests
 * at a later point in time
 */
import express from "express";

import * as HTTPResponseCode from "../core/HTTPResponseCode";

interface PendingResponseStoreData {
    response: express.Response,
    timeoutHandle?: NodeJS.Timer,
}

const store = new Map<number, PendingResponseStoreData>();
let globalId: number = 0;

function incrementGlobalId() {
    return globalId = (globalId + 1) >>> 0;
}

function retrieveDataFromStore(id: number) {
    return store.get(id);
}

/**
 * Adds response object into store.
 * 
 * @param {express.Response} res Express Response object
 * @param {number} timeout Timeout period in milliseconds after which a HTTP 504 error will be sent
 * @returns {number} ID of response stored
 */
export function add(res: express.Response, timeout?: number) {
    const id = incrementGlobalId();

    // Check that slot has not been used
    if (retrieveDataFromStore(id) !== undefined) {
        throw new Error(`Slot ${id} is in use`);
    }

    const data: PendingResponseStoreData = {
        response: res,
    }

    // If timeout set, force response with a server error
    if (timeout && timeout > 0) {
        data.timeoutHandle = setTimeout(() => {
            // Timeout response
            res
                .status(HTTPResponseCode.SERVER_ERROR.GATEWAY_TIME_OUT)
                .end();

            // Clean up
            remove(id);
        }, timeout);
    }

    store.set(id, data);

    return id;
}

/**
 * Gets the response object stored at the slot of given ID.
 * 
 * @param {number} id ID of response stored
 */
export function get(id: number) {
    const data = retrieveDataFromStore(id);

    if (data === undefined) {
        return undefined;
    }

    return data.response;
}

/**
 * Stops the timeout attached to response, if any.
 * 
 * @param {number} id ID of response stored
 */
export function stopTimeout(id: number) {
    const data = retrieveDataFromStore(id);

    if (data === undefined) {
        return;
    }

    if (data.timeoutHandle !== undefined) {
        clearTimeout(data.timeoutHandle);
    }
}

/**
 * Removes response object from store.
 * Stops timeouts attached to response, if any.
 * 
 * @param {number} id ID of response stored
 */
export function remove(id: number) {
    // Stop any timeouts we've set
    stopTimeout(id);

    return store.delete(id);
}
