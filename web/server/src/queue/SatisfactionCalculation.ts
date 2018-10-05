import * as IPCData from "../data/IPCData";
import * as IPCQueue from "../data/IPCQueue";

import { generateSatisfactionMapFromAnnealRequest } from "../anneal/ConstraintSatisfaction";

export function init() {
    IPCQueue.openQueue()
        .process("satisfaction-calculation", 1, async (job, done) => {
            const data: IPCData.SatisfactionCalculationJobData = job.data;
            const { annealNodes, constraints, recordData, strata } = data;

            // Start processing job
            console.log(`Calculating satisfaction...`);

            try {
                // Map out the satisfaction objects per node
                const satisfactionObjects =
                    annealNodes.map(annealNode => generateSatisfactionMapFromAnnealRequest(annealNode, recordData, strata, constraints));

                done(undefined, satisfactionObjects);

                console.log(`Satisfaction calculation finished`);
            } catch (error) {
                console.log('Error encountered in satisfaction calculation: ');
                console.log(error);
                done(error);
            }
        });
}
