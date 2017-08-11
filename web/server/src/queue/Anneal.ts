import * as SourceData from "../data/SourceData";
import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as Anneal from "../anneal/Anneal";

export function init(workerId: string) {
    IPCQueue.openQueue()
        .process("anneal", 1, (job, done) => {
            const data: IPCData.AnnealJobData = job.data;
            const serverResponseId = data.serverResponseId;

            // Start processing job
            console.log(`Anneal worker ${workerId} - Start`);

            try {
                const { strata, constraints, recordData, annealNodes } = data.annealRequest;

                // // Convert sourceData description to that which uses partitioned record
                // // arrays, if records are not already partitioned
                // const convertedSourceData = SourceData.convertToPartitionedRecordArrayDesc(sourceData);

                // Run anneal
                const result = Anneal.anneal(convertedSourceData, strata, constraints);

                const resultMessage: IPCData.AnnealResultMessageData = {
                    result,
                    serverResponseId,
                }

                // Pass message back with result
                IPCQueue.queueMessage("anneal-result", resultMessage);

                done();

            } catch (error) {
                const resultMessage: IPCData.AnnealResultMessageData = {
                    error: '' + error,
                    serverResponseId,
                }

                // Pass message back with error
                IPCQueue.queueMessage("anneal-result", resultMessage);

                console.error(error);
                done(error);

            } finally {
                console.log(`Anneal worker ${workerId} - Finish`);
            }
        });
}
