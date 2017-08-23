import * as kue from "kue";

/** Default TTL = 30 minutes */
export const DefaultTTL: number = 1000 * 60 * 30;

export const openQueue = kue.createQueue;

export const queueMessage = (type: string, data: any, ttl: number = DefaultTTL, removeOnComplete: boolean = true) => {
    const queue = openQueue();
    return queue
        .create(type, data)
        .ttl(ttl)
        .removeOnComplete(removeOnComplete)
        .save();
}
