import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as PendingResultCollationStore from "../data/PendingResultCollationStore";

export function init() {
    IPCQueue.openQueue()
        .process("anneal-result", 1, (job, done) => {
            const data: IPCData.AnnealResultMessageData = job.data;
            const redisResponseId = data._meta.redisResponseId;
            
            try {
                // Find the result collation object
                const resultCollationObj = PendingResultCollationStore.get(redisResponseId);
                

                if (resultCollationObj === undefined) {
                    throw new Error(`No result collation object found for ID ${redisResponseId}`);
                }

                // Collate result (regardless of whether it is successful or not)
                resultCollationObj.results.push(data);

                // If we have all the results we need, then we hand the object 
                // off to the response handling queue and remove the collation 
                // object from the store
                if (resultCollationObj.expectedNumberOfResults === resultCollationObj.results.length) {
                    const responseMessageData: IPCData.AnnealResponseMessageData = {
                        _meta: {
                            redisResponseId
                        },

                        results: resultCollationObj.results,
                    };

                    IPCQueue.queueMessage("anneal-response", responseMessageData);

                    PendingResultCollationStore.remove(redisResponseId);
                }

                done();

            } catch (error) {
                // Pass error back if this process fails
                const resultMessage: IPCData.AnnealResponseMessageData = {
                    _meta: {
                        redisResponseId
                    },

                    error: "" + error,
                };

                // Pass message back with error
                IPCQueue.queueMessage("anneal-response", resultMessage);

                console.error(error);
                done(error);
            }
        });
}
