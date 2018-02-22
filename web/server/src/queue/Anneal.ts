import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as Anneal from "../anneal/Anneal";

import * as RedisService from "../utils/RedisService";

export function init(workerId: string) {
    IPCQueue.openQueue()
        .process("anneal", 1, async (job, done) => {
            const data: IPCData.AnnealJobData = job.data;
            const { _meta, annealNode, constraints, recordData, strata } = data as any;
            const { redisResponseId } = _meta as any;


            console.log('Anneal node id : ');
            console.log(annealNode.id);
            await RedisService.findAndUpdate(redisResponseId, { workerId: workerId, status: "Starting anneal ...", timestamp: Date.now(), annealNode: annealNode });


            // Start processing job
            // const tag = `[${_meta.annealNode.index} of ID = ${_meta.serverResponseId}]`;
            const tag = `[${_meta.annealNode.index} of ID = ${_meta.redisResponseId}]`;
            
            console.log(`Anneal worker ${workerId} - Starting anneal for ${tag}...`);

            try {
                // Run anneal
                const result = Anneal.anneal(annealNode, recordData, strata, constraints);

                const resultMessage: IPCData.AnnealResultMessageData = {
                    _meta,

                    result,
                }
                // await RedisService.findAndUpdate(redisResponseId, resultMessage);
                // Pass message back with result
                IPCQueue.queueMessage("anneal-result", resultMessage);
                
                done();

            } catch (error) {
                const resultMessage: IPCData.AnnealResultMessageData = {
                    _meta,

                    error: "" + error,
                }

                // Pass message back with error
                IPCQueue.queueMessage("anneal-result", resultMessage);

                console.error(error);
                done(error);

            } finally {
                console.log(`Anneal worker ${workerId} - Finished ${tag}`);
            }
        });
}
