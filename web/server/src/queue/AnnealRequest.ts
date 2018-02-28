import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as PendingResultCollationStore from "../data/PendingResultCollationStore";
import * as RedisService from "../utils/RedisService";

export function init() {
    IPCQueue.openQueue()
        .process("anneal-request", 1, (job, done) => {
            const data: IPCData.AnnealRequestMessageData = job.data;
            const { annealRequest, _meta } = data;
            const { serverResponseId } = _meta as any;
            const { redisResponseId } = _meta as any;


            // Start processing job
            console.log(`Anneal request [${redisResponseId}] - Starting...`);
            try {
                const { strata, constraints, recordData, annealNodes } = annealRequest;

                // Create entry in result collation store
                PendingResultCollationStore.add(redisResponseId, annealNodes.length);
                RedisService.getClient().set(redisResponseId + '-expectedNumberOfResults', annealNodes.length + '');                
                // Split job, one per anneal node in the request
                annealNodes.forEach((annealNode, i) => {
                    console.log(`Anneal request [${redisResponseId}] - Splitting job: #${i}`);

                    // const annealJobMessage: IPCData.AnnealJobData = {
                    const annealJobMessage: any = {
                        _meta: {
                            redisResponseId,
                            serverResponseId,
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
                        serverResponseId,
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
