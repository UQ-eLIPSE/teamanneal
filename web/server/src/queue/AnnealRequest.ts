import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as PendingResultCollationStore from "../data/PendingResultCollationStore";

export function init() {
    IPCQueue.openQueue()
        .process("anneal-request", 1, (job, done) => {
            const data: IPCData.AnnealRequestMessageData = job.data;

            const { annealRequest, _meta } = data;
            const { serverResponseId } = _meta;

            // Start processing job
            console.log(`Anneal request [${serverResponseId}] - Starting...`);

            try {
                const { strata, constraints, recordData, annealNodes } = annealRequest;

                // Create entry in result collation store
                PendingResultCollationStore.add(serverResponseId, annealNodes.length);

                // Split job, one per anneal node in the request
                annealNodes.forEach((annealNode, i) => {
                    console.log(`Anneal request [${serverResponseId}] - Splitting job: #${i}`);

                    const annealJobMessage: IPCData.AnnealJobData = {
                        _meta: {
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
