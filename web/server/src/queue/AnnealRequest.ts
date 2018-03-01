import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as PendingResultCollationStore from "../data/PendingResultCollationStore";
import * as RedisService from "../utils/RedisService";

/**
 * Stores the expected number of partitions in redis as a new key
 * @param redisResponseId 
 * @param numberOfResults Expected number of results
 */
function storeExpectedNumberOfResults(redisResponseId: string, numberOfResults: number): boolean {
    return RedisService.getClient().set(redisResponseId + '-expectedNumberOfResults', numberOfResults + ''); 
}

export function init() {
    IPCQueue.openQueue()
        .process("anneal-request", 1, (job, done) => {
            const data: IPCData.AnnealRequestMessageData = job.data;
            const { annealRequest, _meta } = data;
            const { redisResponseId } = _meta;


            // Start processing job
            console.log(`Anneal request [${redisResponseId}] - Starting...`);
            try {
                const { strata, constraints, recordData, annealNodes } = annealRequest;

                // Create entry in result collation store
                PendingResultCollationStore.add(redisResponseId, annealNodes.length);
                
                // Set expected number of results for anneal in redis
                storeExpectedNumberOfResults(redisResponseId, annealNodes.length);               
                
                // Split job, one per anneal node in the request
                annealNodes.forEach((annealNode, i) => {
                    console.log(`Anneal request [${redisResponseId}] - Splitting job: #${i}`);

                    const annealJobMessage: IPCData.AnnealJobData = {
                        _meta: {
                            redisResponseId,
                            annealNode: {
                                id: annealNode._id,
                                index: i,
                            },
                        },

                        annealNode,
                        constraints,
                        recordData,
                        strata,
                    };

                    IPCQueue.queueMessage("anneal", annealJobMessage);
                });

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
