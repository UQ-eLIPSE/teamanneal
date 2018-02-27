// import * as ToClientAnnealResponse from "../../../common/ToClientAnnealResponse";

// import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";
import * as RedisService from "../utils/RedisService";
import AnnealStatus from "../../../common/AnnealStatus";

// import * as PendingResponseStore from "../data/PendingResponseStore";

// This must be run within the same process as the one that sets the response
// objects into the store (generally main server process.)

export function init() {
    IPCQueue.openQueue()
        .process("anneal-response", 1, async (job, done) => {
            const responseMessageData: IPCData.AnnealResponseMessageData = job.data;

            const { error, results, _meta } = responseMessageData;
            // const { serverResponseId } = _meta;
            const { redisResponseId } = _meta as any;

            // const res = PendingResponseStore.get(serverResponseId);
            // const res = PendingResponseStore.get(redisResponseId);
            // let res: any;

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
                await RedisService.findAndUpdate(redisResponseId, {status: AnnealStatus.ANNEAL_COMPLETE, results});
                

            }
       
            if (error !== undefined) {
                console.log('error occured during anneal');
                await RedisService.findAndUpdate(redisResponseId, {status: AnnealStatus.ANNEAL_FAILED, error});
            }
            // await RedisService.findAndUpdate(redisResponseId, JSON.stringify(results));
            // console.log('Results');
            // console.log(JSON.parse(await RedisService.getValue(redisResponseId)));
            // console.log(`Anneal response incoming message for response ID ${serverResponseId}`);
            // console.log(`Anneal response incoming message for response ID ${redisResponseId}`);


            // if (res === undefined) {
            //     // throw new Error(`No response object found for ID ${serverResponseId}`);
            //     throw new Error(`No response object found for ID ${redisResponseId}`);

            // }

            // if (error !== undefined) {
            //     const response: ToClientAnnealResponse.Root = {
            //         error,
            //     };

            //     console.log(response);
            //     res
            //         .status(HTTPResponseCode.SERVER_ERROR.INTERNAL_SERVER_ERROR)
            //         .json(response);

            // } else {
            //     const response: ToClientAnnealResponse.Root = {
            //         results,
            //     };

            //     res
            //         .status(HTTPResponseCode.SUCCESS.OK)
            //         .json(response);
            // }

            // Clean up response from the map
            // PendingResponseStore.remove(serverResponseId);

            done();
        });
}
