import * as kue from "kue";

export const openQueue = kue.createQueue;

export const queueMessage = (type: string, data: any, removeOnComplete: boolean = true) => {
    const queue = openQueue();
    return queue
        .create(type, data)
        .removeOnComplete(removeOnComplete)
        .save();
}
