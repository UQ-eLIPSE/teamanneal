import * as AnnealJobHandler from "../queue/Anneal";

export function init(workerId: string) {
    console.log(`Anneal worker ${workerId} - Initialising anneal job handler`);
    AnnealJobHandler.init(workerId);

    console.log(`Anneal worker ${workerId} - Initialisation complete`);
}
