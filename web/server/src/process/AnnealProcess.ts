import * as AnnealJobHandler from "../queue/Anneal";

export function initialise(workerId: string) {
    console.log(`Anneal worker ${workerId} - Initialising anneal job handler`);
    AnnealJobHandler.initialise(workerId);

    console.log(`Anneal worker ${workerId} - Initialisation complete`);
}
