import * as kue from "kue";

export const openQueue = kue.createQueue;

export const queueMessage = (type: string, data: any) => {
    const queue = openQueue();
    return queue
        .create(type, data)
        .removeOnComplete(true)
        .save();
}
