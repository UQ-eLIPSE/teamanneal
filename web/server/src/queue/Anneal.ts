import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as Anneal from "../anneal/Anneal";

import * as RedisService from "../utils/RedisService";
import AnnealStatus from "../../../common/AnnealStatus";
import { AnnealStatusState } from "../../../common/AnnealState";

export function init(workerId: string) {
    IPCQueue.openQueue()
        .process("anneal", 1, async (job, done) => {
            const data: IPCData.AnnealJobData = job.data;
            const { _meta, annealNode, constraints, recordData, strata } = data;
            const { redisResponseId } = _meta;

            const annealState: AnnealStatusState = {
                workerId: workerId,
                status: AnnealStatus.ANNEAL_STARTED,
                timestamp: Date.now(),
                annealNode: Object.assign({}, annealNode)
            }
            await RedisService.pushAnnealState(redisResponseId, annealState);


            // Start processing job
            const tag = `[${_meta.annealNode.index} of ID = ${_meta.redisResponseId}]`;

            console.log(`Anneal worker ${workerId} - Starting anneal for ${tag}...`);

            try {
                // Run anneal
                const result = Anneal.anneal(annealNode, recordData, strata, constraints);

                const resultMessage: IPCData.AnnealResultMessageData = {
                    _meta,

                    result,
                }

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
                const annealState: AnnealStatusState = {
                    workerId: workerId,
                    status: AnnealStatus.PARTITION_FINISHED,
                    timestamp: Date.now(),
                    annealNode: Object.assign({}, annealNode)
                }

                // Update status when partition has been annealed
                await RedisService.pushAnnealState(redisResponseId, annealState);
                console.log(`Anneal worker ${workerId} - Finished ${tag}`);
            }
        });
}
