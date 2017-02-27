import * as Config from "./Config";
import * as Constraint from "./Constraint";
import * as SourceRecord from "./SourceRecord";
import * as Partition from "./Partition";
import * as Group from "./Group";
import * as Anneal from "./Anneal";
import * as Util from "./Util";
import * as AnnealThread from "./AnnealThread";

// Some globals we know should exist
declare const csvFileInput: HTMLInputElement;
declare const constraintsFileInput: HTMLInputElement;
declare const performAnneal: HTMLButtonElement;
declare const saveAs: Function;




const teamAnneal = {
    prepareConstraints: (config: Config.Root) => (records: SourceRecord.Set) => {
        return Constraint.wrapConstraints(records)(config.constraints);
    },

    preparePartitions: (config: Config.Root) => (records: SourceRecord.Set) => {
        // Create partitions
        const partitions = Partition.createPartitions(config.partition)(records);

        // Form groups in partitions
        // TODO: This does not support all levels; just the last one
        const level = config.levels[config.levels.length - 1];

        return partitions.map(
            (partition, partitionIndex) => {
                const partitionGroups = Group.generateGroups
                    (level)
                    ((groupIndex) => `P${partitionIndex}::G${groupIndex}`)
                    (partition.records);

                return Partition.attachGroupsToPartition(partition)(partitionGroups);
            }
        );
    },

    /**
     * Old single threaded anneal.
     * 
     * Try not to use this.
     */
    anneal: (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) => (partitions: ReadonlyArray<Partition.PartitionWithGroup>) => {
        return partitions.map(
            (partition) => {
                const timerStart = Util.timer();
                const run = Anneal.run(constraints)(partition);
                return {
                    ...run,
                    executionMs: Util.timer(timerStart),
                }
            }
        );
    },

    /**
     * Generally one less than the reported number of available logical processors.
     * 
     * If undetectable, returns `undefined`.
     */
    estimateThreadsToUse: () => {
        const threads = (navigator.hardwareConcurrency || 0) - 1;

        if (threads === -1) {
            return undefined;
        }

        return Math.max(1, threads);
    },

    annealThreaded: (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) => (partitions: ReadonlyArray<Partition.PartitionWithGroup>) => (numberOfThreads: number) => {
        // Queuing
        const partitionQueue = Util.copyArray(partitions);
        const threadPartitions: Partition.PartitionWithGroup[][] = [];

        for (let i = 0; i < partitionQueue.length; ++i) {
            let arr = threadPartitions[i % numberOfThreads] || [];

            if (!arr.length) {
                threadPartitions[i % numberOfThreads] = arr;
            }

            arr.push(partitionQueue[i]);
        }

        // # of threads range clipping: [1, # of partitions]
        numberOfThreads = Math.max(1, Math.min(numberOfThreads, partitionQueue.length));

        // Fire up threads
        console.log(`Creating ${numberOfThreads} thread(s)...`);
        const threads = Util.blankArray(numberOfThreads).map(() => new Worker("./build/thread.js"));

        const msgThread = (thread: Worker) => (message: AnnealThread.MessageFormat) => {
            return thread.postMessage(message);
        }

        // Run
        return new Promise<AnnealThread.AnnealThreadedResult[]>((resolve, _reject) => {
            const expectedNumberOfResults = partitionQueue.length;
            const results: AnnealThread.AnnealThreadedResult[] = [];

            threads.forEach(async (thread, i) => {
                // Wait for ready
                await new Promise((resolve, _reject) => {
                    thread.onmessage = (e) => {
                        const message: AnnealThread.MessageFormat = e.data;

                        if (message.event === "ready") {
                            console.log(`Thread ${i} ready`);
                            resolve();
                        }
                    }
                });

                // Configure
                msgThread(thread)({
                    event: "configure",
                    data: {
                        id: i,
                        constraints,
                    }
                });

                // Wait for configureOkay
                await new Promise((resolve, _reject) => {
                    thread.onmessage = (e) => {
                        const message: AnnealThread.MessageFormat = e.data;

                        if (message.event === "configureOkay") {
                            console.log(`Thread ${i} configuration successful`);
                            resolve();
                        }
                    }
                });


                // Get this thread's queued partitions
                const partitions = threadPartitions[i];

                // Set up response event handler
                const setOnAnnealResultHandler = (() => {
                    let onAnnealResultHandler: (result: AnnealThread.AnnealThreadedResult) => void = () => { };

                    const onAnnealResult =
                        (result: AnnealThread.AnnealThreadedResult) => {
                            onAnnealResultHandler(result);
                        }

                    thread.onmessage = (e) => {
                        const message: AnnealThread.MessageFormat = e.data;

                        const { event, data } = message;

                        if (event === "annealResult") {
                            onAnnealResult(data);
                        }
                    }

                    return (handler: typeof onAnnealResultHandler) => {
                        onAnnealResultHandler = handler;
                    };
                })();






                // Execute over partitions
                let job: number = 0;
                const totalJobs = partitions.length;

                for (let partition of partitions) {
                    // Response waiting promise
                    const response = new Promise<AnnealThread.AnnealThreadedResult>((resolve, _reject) => {
                        setOnAnnealResultHandler((result) => resolve(result));
                    });

                    console.log(`Thread ${i} annealing ${++job}/${totalJobs}`);

                    // Trigger anneal on thread
                    msgThread(thread)({
                        event: "anneal",
                        data: {
                            partition,
                        }
                    });

                    // Wait for response
                    const result = await response;

                    results.push(result);
                }

                // Kill thread once done
                thread.terminate();
                console.log(`Thread ${i} finished`);

                // Check if we're at the end
                if (results.length === expectedNumberOfResults) {
                    resolve(results);
                }
            });
        });
    },

    onPerformAnnealButtonClick: async () => {
        // Parse the files
        const csvFile = csvFileInput.files![0];
        const csvParseResult = await new Promise<PapaParse.ParseResult>((resolve, _reject) => {
            Papa.parse(csvFile, {
                dynamicTyping: true,
                header: true,
                complete: resolve,
            });
        });

        const csvData = csvParseResult.data;

        const constraintsFile = constraintsFileInput.files![0];
        const constraintsReadResult = await new Promise<Event>((resolve, _reject) => {
            const constraintsReader = new FileReader();
            constraintsReader.onload = resolve;
            constraintsReader.readAsText(constraintsFile);
        });

        const constraintsText = (constraintsReadResult.target as any).result;
        const constraintsConfig = JSON.parse(constraintsText);


        // Prepare
        const constraints = teamAnneal.prepareConstraints(constraintsConfig)(csvData);
        const partitions = teamAnneal.preparePartitions(constraintsConfig)(csvData);

        let threads = teamAnneal.estimateThreadsToUse();

        if (!threads) {
            // Prompt for number of threads if we can't estimate
            const threadNumString = prompt("Enter number of threads", "1");

            if (!threadNumString) {
                return;
            }

            threads = Math.max(1, parseInt(threadNumString) >>> 0);
        }



        // Run
        const startTimer = performance.now();
        const results = await teamAnneal.annealThreaded(constraints)(partitions)(threads);

        const execTime = performance.now() - startTimer;
        const threadTime = results.reduce((acc, x) => acc + x.result.time.executionMs, 0);

        console.log("-----");
        console.log(`Total exec time: ${execTime / 1000}s`);
        console.log(`Total thread time: ${threadTime / 1000}s`);
        console.log(`Threading speedup: ${threadTime / execTime}`);
        console.log("-----");
        console.log("Everything (all objects, annealing/rearrangement history) can be found in global: `__results`");

        (<any>window)["__results"] = results;



        // Export
        const outCsvData = results
            .map(x => x.result.result.partition.groups)
            .map(x => {
                return x.map(y => {
                    return y.records.map(z => {
                        return Object.assign({ __group: y.name }, z);
                    })
                }).reduce((arr, y) => arr.concat(y), [])
            })
            .reduce((arr, x) => arr.concat(x), []);


        const outCsvText = Papa.unparse(outCsvData);
        const outCsvBlob = new Blob([outCsvText], { type: "text/csv;charset=utf-8" });

        saveAs(outCsvBlob, `${csvFile.name}.annealed.csv`);
    }
};

// Configure button
performAnneal.onclick = teamAnneal.onPerformAnnealButtonClick;

// Make it global under `__teamAnneal`
(<any>window)["__teamAnneal"] = teamAnneal;

