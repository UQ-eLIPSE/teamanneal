import * as kue from "kue";

const queue = kue.createQueue();

export const process = queue.process;
export const create = queue.create;

export const queueMessage = (type: string, data: any) => {
    return queue
        .create(type, data)
        .removeOnComplete(true)
        .save();
}
