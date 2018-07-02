import os from "os";
import cluster from "cluster";

import * as ServerProcess from "./process/ServerProcess";
import * as AnnealProcess from "./process/AnnealProcess";

import { Config } from "./utils/Config";

/// Worker allocation
// -------------------------------------------------------------------------
// Worker ID | Description
// -------------------------------------------------------------------------
//    Master | Web server process
//           | * Responsible for direct communication to client
//           | * Server creates anneal jobs, one for each anneal node, onto
//           |   the anneal queue to reduce processing impact on main server
//           |   thread
//           |
//        0+ | Anneal worker ("anneal")
//           | * Run actual annealing on data that is queued by the anneal
//           |   request worker

if (cluster.isMaster) {
    // Initialise the main server process for master
    ServerProcess.init();

    // Number of anneal workers is (CPU cores - 1), with a floor of 2 and a cap
    // of some configured maximum (due to memory constraints on most systems)
    const numberOfCpus = os.cpus().length;
    const numberOfAnnealWorkers = Math.min(Config.get().server.workers.maxInstances, Math.max(2, numberOfCpus - 1));

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

    // Anneal worker
    AnnealProcess.init(workerId);
}
