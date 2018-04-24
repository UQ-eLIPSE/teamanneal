import * as ToClientAnnealResponse from "../../../common/ToClientAnnealResponse";

import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
import * as RedisService from "../utils/RedisService";
import { AnnealStatus } from "../../../common/AnnealStatus";

// This must be run within the same process as the one that sets the response
// objects into the store (generally main server process.)

export function init() {
    IPCQueue.openQueue()
        .process("anneal-response", 1, async (job, done) => {
            const responseMessageData: IPCData.AnnealResponseMessageData = job.data;

            const { error, results, _meta } = responseMessageData;
            const { redisResponseId } = _meta;

            if (results !== undefined) {
                // Sort results array by node index
                results.sort((a, b) => {
                    const indexA = a._meta.annealNode.index;
                    const indexB = b._meta.annealNode.index;

                    if (indexA < indexB) return -1;
                    if (indexA > indexB) return 1;

                    return 0;
                });

                // Strip _meta
                results.forEach((result) => {
                    delete result["_meta"];
                });
                const clientReponseObject: ToClientAnnealResponse.Root = {
                    status: AnnealStatus.ANNEAL_COMPLETE,
                    results: [...results]
                };
                await RedisService.pushAnnealState(redisResponseId, clientReponseObject);
            }

            if (error !== undefined) {
                console.log('error occured during anneal');

                const clientReponseObject: ToClientAnnealResponse.Root = {
                    status: AnnealStatus.ANNEAL_FAILED,
                    error: error + ""
                }
                await RedisService.pushAnnealState(redisResponseId, clientReponseObject);
            }

            done();


        });
}
