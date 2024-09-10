import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import * as PendingResultCollationStore from "../data/PendingResultCollationStore";

import * as ToClientAnnealResponse from "../../../common/ToClientAnnealResponse";
import { AnnealStatus } from "../../../common/AnnealStatus";

import * as RedisService from "../utils/RedisService";

export function init() {
    IPCQueue.openQueue()
        .process("anneal-result", 1, async (job, done) => {
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
                    const results = resultCollationObj.results;

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
                        //@ts-ignore
                        delete result["_meta"];
                    });

                    const clientReponseObject: ToClientAnnealResponse.Root = {
                        status: AnnealStatus.ANNEAL_COMPLETE,
                        results: [...results]
                    };

                    await RedisService.pushAnnealState(redisResponseId, clientReponseObject);

                    // NOTE: We do not deliver a response to the client as they are
                    // expected to pick up the result at the next anneal status
                    // request

                    PendingResultCollationStore.remove(redisResponseId);
                }

                done();

            } catch (error) {
                // Pass error back if this process fails
                const clientReponseObject: ToClientAnnealResponse.Root = {
                    status: AnnealStatus.ANNEAL_FAILED,
                    error: error + ""
                }

                await RedisService.pushAnnealState(redisResponseId, clientReponseObject);

                // NOTE: We do not deliver a response to the client as they are
                // expected to pick up the result at the next anneal status
                // request

                console.error(error);
                done(error);
            }
        });
}
