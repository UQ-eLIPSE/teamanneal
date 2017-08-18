import * as os from "os";
import * as cluster from "cluster";

import * as ServerProcess from "./process/ServerProcess";
import * as AnnealRequestProcess from "./process/AnnealRequestProcess";
import * as AnnealProcess from "./process/AnnealProcess";

/// Worker allocation
// -------------------------------------------------------------------------
// Worker ID | Description
// -------------------------------------------------------------------------
//    Master | Web server process (also listens to "anneal-response" queue)
//           | * Responsible for direct communication to client
//           | * Server forwards request to the anneal request queue to 
//           |   reduce processing impact on main server thread
//           |
//         0 | Anneal request worker ("anneal-request", "anneal-result")
//           | * Receives forwarded requests from main server process, and
//           |   creates anneal jobs, one for each anneal node
//           | * Also responsible for waiting for all individual anneals
//           |   to complete, and compiling the final response to be given
//           |   back to the main server process to send back to the client
//           |
//        1+ | Anneal worker ("anneal")
//           | * Run actual annealing on data that is queued by the anneal
//           |   request worker 

if (cluster.isMaster) {
    // Initialise the main server process for master
    ServerProcess.init();

    // Number of anneal workers is (CPU cores - 1), with a floor of 2 and a cap
    // of 20 maximum (due to memory constraints on most systems)
    //
    // TODO: The maximum should be configurable

    const numberOfCpus = os.cpus().length;
    const numberOfAnnealWorkers = Math.min(2, Math.max(2, numberOfCpus - 1));

    // Start up anneal workers
    console.log(`Creating ${numberOfAnnealWorkers} anneal workers...`);
    for (let i = 0; i < numberOfAnnealWorkers; ++i) {
        const workerId = "" + i;

        console.log(`* Forking process with worker ID: ${workerId}`);

        cluster.fork({
            "ANNEAL_WORKER_ID": workerId,
        });
    }

} else {
    const workerId: string | undefined = process.env["ANNEAL_WORKER_ID"];

    if (workerId === undefined || workerId.length === 0) {
        throw new Error("Undefined worker ID");
    }

    const workerNumId = +workerId;

    if (workerNumId === 0) {
        // Anneal request worker
        AnnealRequestProcess.init();
    } else {
        // Anneal worker
        AnnealProcess.init(workerId);
    }
}
