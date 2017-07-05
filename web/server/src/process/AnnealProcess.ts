import * as kue from "kue";

// Data manipulation and structures
import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as SourceData from "../data/SourceData";

// Anneal-related
import * as Anneal from "../anneal/Anneal";


const queue = kue.createQueue();

interface AnnealJobData {
    serverAnnealRequest: ToServerAnnealRequest.Root,
    serverResponseId: number,
}

interface AnnealResultMessageData {
    result?: any,
    error?: any,
    serverResponseId: number,
}




export function initialise(workerId: string) {
    queue.process("anneal", 1, (job, done) => {
        const data: AnnealJobData = job.data;
        const serverResponseId = data.serverResponseId;
        const { strata, constraints, sourceData } = data.serverAnnealRequest;

        // Convert sourceData description to that which uses partitioned record
        // arrays, if records are not already partitioned
        const convertedSourceData = SourceData.convertToPartitionedRecordArrayDesc(sourceData);

        // Run anneal
        console.log(`Anneal worker ${workerId} - START`);
        try {
            const result = Anneal.anneal(convertedSourceData, strata, constraints);

            const resultMessage: AnnealResultMessageData = {
                result,
                serverResponseId,
            }

            queue.create("anneal-result", resultMessage).save();

            console.log(JSON.stringify(result));
            done();

        } catch (error) {
            const resultMessage: AnnealResultMessageData = {
                error,
                serverResponseId,
            }

            queue.create("anneal-result", resultMessage).save();

            console.error(error);
            done(error);

        } finally {
            console.log(`Anneal worker ${workerId} - FINISH`);
        }
    });

    console.log(`Anneal worker ${workerId} - Initialisation complete`);
}
