/*
 * TeamAnneal Web
 */
import * as os from "os";
import * as cluster from "cluster";

import * as ServerProcess from "./process/ServerProcess";
import * as AnnealProcess from "./process/AnnealProcess";


// Number of anneal workers is CPU cores - 2, with a floor of 1
const numberOfAnnealWorkers = Math.max(1, os.cpus().length - 2);


if (cluster.isMaster) {
    // Initialise the main server process for master
    ServerProcess.initialise();

    // Start up anneal workers
    console.log(`Creating ${numberOfAnnealWorkers} anneal workers...`);
    for (let i = 0; i < numberOfAnnealWorkers; ++i) {
        const workerId = '' + i;

        console.log(`* Forking process with worker ID: ${workerId}`);

        cluster.fork({
            "ANNEAL_WORKER_ID": workerId,
        });
    }
} else {
    // All children processes are anneal workers
    const workerId: string | undefined = process.env["ANNEAL_WORKER_ID"];

    if (workerId === undefined || workerId.length === 0) {
        throw new Error("Undefined worker ID");
    }

    AnnealProcess.initialise(workerId);
}
