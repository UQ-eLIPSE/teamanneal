import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
import * as PendingResponseStore from "../data/PendingResponseStore";

export function initialise() {
    IPCQueue.queue.process("anneal-result", 1, (job, done) => {
        const annealResultMessageData: IPCData.AnnealResultMessageData = job.data;

        const { error, result, serverResponseId } = annealResultMessageData;
        const res = PendingResponseStore.get(serverResponseId);

        console.log(`Anneal result received for response ID ${serverResponseId}`);

        if (res === undefined) {
            throw new Error(`No response object found for ID ${serverResponseId}`);
        }

        if (error) {
            res
                .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
                .json({
                    error,
                });
        } else {
            res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json({
                    output: result,
                });
        }

        // Clean up response from the map
        PendingResponseStore.remove(serverResponseId);

        done();
    });
}
