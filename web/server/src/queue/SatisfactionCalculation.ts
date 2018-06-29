import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import { generateSatisfactionMapFromAnnealRequest } from "../anneal/ConstraintSatisfaction";

export function init(workerId: string) {
    IPCQueue.openQueue()
        .process("satisfaction-calculation", 1, async (job, done) => {
            const data: IPCData.SatisfactionCalculationJobData = job.data;
            const { _meta, annealNodes, constraints, recordData, strata } = data;

            // Start processing job
            const tag = `[${_meta.annealNode.index} of ID = ${_meta.redisResponseId}]`;

            console.log(`Anneal worker ${workerId} - Calculating satisfaction for ${tag}...`);

            // Map out the satisfaction objects per node
            const satisfactionObjects =
                annealNodes.map(annealNode => generateSatisfactionMapFromAnnealRequest(annealNode, recordData, strata, constraints));

            done(undefined, satisfactionObjects);
        });
}
