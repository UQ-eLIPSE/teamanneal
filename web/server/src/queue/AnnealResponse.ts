import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
import * as PendingResponseStore from "../data/PendingResponseStore";

// This must be run within the same process as the one that sets the response
// objects into the store (generally main server process.)

export function init() {
    IPCQueue.openQueue()
        .process("anneal-response", 1, (job, done) => {
            const responseMessageData: IPCData.AnnealResponseMessageData = job.data;

            const { error, result, _meta } = responseMessageData;
            const { serverResponseId } = _meta;

            const res = PendingResponseStore.get(serverResponseId);

            console.log(`Anneal response incoming message for response ID ${serverResponseId}`);

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
