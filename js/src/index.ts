import * as Config from "./Config";
import * as Constraint from "./Constraint";
import * as SourceRecord from "./SourceRecord";
import * as Partition from "./Partition";
import * as Util from "./Util";
import * as AnnealThread from "./AnnealThread";
import * as Anneal from "./Anneal";
import * as StringMap from "./StringMap";
import * as ColumnInfo from "./ColumnInfo";
import * as ColumnDesc from "./ColumnDesc";
import * as CostFunction from "./CostFunction";
import * as SourceRecordSet from "./SourceRecordSet";

// Some globals we know should exist
declare const csvFileInput: HTMLInputElement;
declare const configFileInput: HTMLInputElement;
declare const performAnneal: HTMLButtonElement;
declare const performAnnealSingleThread: HTMLButtonElement;
declare const killThreads: HTMLButtonElement;
declare const saveAs: Function;


let threads: Worker[] | undefined;

const teamAnneal = {
    prepareStringMap: () => {
        return StringMap.init();
    },

    prepareColumnInfoAndRecords: (stringMap: StringMap.StringMap) => (headers: string[]) => (rawRecords: SourceRecord.RawRecord[]) => {
        // Create column info object
        const columnInfo = ColumnInfo.initFrom(stringMap)(headers)(rawRecords);

        // Convert records
        const records = SourceRecordSet.initFrom(columnInfo)(stringMap)(rawRecords);

        // Populate column info details using records above
        ColumnInfo.populateFrom(columnInfo)(records);

        return {
            columnInfo,
            records,
        }
    },

    prepareConstraints: (stringMap: StringMap.StringMap) => (headers: string[]) => (rawConstraints: ReadonlyArray<Config.Constraint>) => {
        return rawConstraints.map(Constraint.initFromConfigConstraint(stringMap)(headers));
    },

    preparePartitions: (columnIndex: number | undefined) => (minSize: number) => (idealSize: number) => (maxSize: number) => (records: SourceRecordSet.SourceRecordSet) => {
        // If no partition column defined, create one with the entire set of records
        if (columnIndex === undefined) {
            return [
                Partition.initWith(records)(minSize)(idealSize)(maxSize),
            ];
        }

        // Pick set of column values
        const distinctColumnValueSet = records.reduce(
            (set, record) => {
                const value = SourceRecord.get(record)(columnIndex);
                set.add(value);
                return set;
            },
            new Set<SourceRecord.Value>()
        );

        // Get distinct values of the column
        const distinctColumnValues: SourceRecord.Value[] = [];
        distinctColumnValueSet.forEach(val => distinctColumnValues.push(val));

        // Create partitions over the distinct values
        return distinctColumnValues.map((value) => {
            return Partition.initWith
                (records.filter(record => SourceRecord.get(record)(columnIndex) === value))
                (minSize)
                (idealSize)
                (maxSize)
        });
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

    anneal:
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (constraints: Constraint.Constraint[]) =>
            (partitions: Partition.Partition[]) => {
                // Run
                return new Promise<Anneal.AnnealIterationResult[]>((resolve, _reject) => {
                    const results: Anneal.AnnealIterationResult[] = [];

                    // Execute over partitions
                    let job: number = 0;
                    const totalJobs = partitions.length;

                    const appliedRecordSetCostFunctions = CostFunction.generateAppliedRecordSetCostFunctions(columnInfo!)(constraints);

                    for (let partition of partitions) {
                        console.log(`Annealing ${++job}/${totalJobs}`);

                        const result = Anneal.run(appliedRecordSetCostFunctions)(partition);

                        results.push(result);
                    }

                    resolve(results);
                });
            },

    annealThreaded:
    (columnInfo: ColumnInfo.ColumnInfo) =>
        (constraints: Constraint.Constraint[]) =>
            (partitions: Partition.Partition[]) =>
                (numberOfThreads: number) => {
                    // # of threads range clipping: [1, # of partitions]
                    numberOfThreads = Math.max(1, Math.min(numberOfThreads, partitions.length));

                    // Queuing
                    const threadPartitions: Partition.Partition[][] = [];

                    for (let i = 0; i < partitions.length; ++i) {
                        let arr = threadPartitions[i % numberOfThreads] || [];

                        if (!arr.length) {
                            threadPartitions[i % numberOfThreads] = arr;
                        }

                        arr.push(partitions[i]);
                    }

                    // Fire up threads
                    console.log(`Creating ${numberOfThreads} thread(s)...`);
                    threads = Util.blankArray(numberOfThreads).map(() => new Worker("./build/thread.js"));

                    const msgThread = (thread: Worker) => (message: AnnealThread.MessageFormat) => {
                        return thread.postMessage(message);
                    }

                    // Run
                    return new Promise<AnnealThread.AnnealThreadResult[]>((resolve, _reject) => {
                        const expectedNumberOfResults = partitions.length;
                        const results: AnnealThread.AnnealThreadResult[] = [];

                        threads!.forEach(async (thread, i) => {
                            // Get this thread's queued partitions
                            const partitions = threadPartitions[i];


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
                            const configData: AnnealThread.AnnealConfiguration = {
                                id: i,
                                constraints,
                                columnInfo: columnInfo,
                            };

                            msgThread(thread)({
                                event: "configure",
                                data: configData,
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



                            // Set up response event handler
                            const setOnAnnealResultHandler = (() => {
                                let onAnnealResultHandler: (result: AnnealThread.AnnealThreadResult) => void = () => { };

                                const onAnnealResult =
                                    (result: AnnealThread.AnnealThreadResult) => {
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
                                const response = new Promise<AnnealThread.AnnealThreadResult>((resolve, _reject) => {
                                    setOnAnnealResultHandler((result) => resolve(result));
                                });

                                console.log(`Thread ${i} annealing ${++job}/${totalJobs}`);

                                // Trigger anneal on thread
                                const annealThreadInput: AnnealThread.AnnealInput = {
                                    partition,
                                }

                                msgThread(thread)({
                                    event: "anneal",
                                    data: annealThreadInput
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


    onPerformAnnealSingleThreadButtonClick: async () => {
        // Parse the files
        const csvFile = csvFileInput.files![0];
        const csvParseResult = await new Promise<PapaParse.ParseResult>((resolve, _reject) => {
            Papa.parse(csvFile, {
                dynamicTyping: true,
                header: false,
                complete: resolve,
            });
        });

        const rawRecords: (string | number)[][] = csvParseResult.data;

        // TODO: Should check for string-iness
        const headers: string[] = rawRecords.shift() as string[];

        const configFile = configFileInput.files![0];
        const configReadResult = await new Promise<Event>((resolve, _reject) => {
            const configReader = new FileReader();
            configReader.onload = resolve;
            configReader.readAsText(configFile);
        });

        const configText = (configReadResult.target as any).result;
        const config: Config.Root = JSON.parse(configText);

        // Find partition generation information
        const level = config.levels[config.levels.length - 1];
        const minSize = level.size.min;
        const idealSize = level.size.ideal;
        const maxSize = level.size.max;

        let partitionColumnIndex: number | undefined = headers.indexOf(config.partition!);
        if (partitionColumnIndex < 0) {
            partitionColumnIndex = undefined;
        }

        // Prepare
        const stringMap = teamAnneal.prepareStringMap();
        const { columnInfo, records } = teamAnneal.prepareColumnInfoAndRecords(stringMap)(headers)(rawRecords);
        const constraints = teamAnneal.prepareConstraints(stringMap)(headers)(config.constraints);
        const partitions = teamAnneal.preparePartitions(partitionColumnIndex)(minSize)(idealSize)(maxSize)(records);

        // Run
        const timerStart = Util.timer();
        const results = await teamAnneal.anneal(columnInfo)(constraints)(partitions);

        const execTime = Util.timer(timerStart);

        console.log("-----");
        console.log(`Total exec time: ${execTime / 1000}s`);
        console.log("-----");
        console.log("Results can be found in global: `__results`");

        (<any>window)["__results"] = results;











        // Export


        // Precompute mapping functions needed per column
        const columnValueRegenerators = (() => {
            const numOutputFunc = (val: number) => Util.isNaN(val) ? "" : val.toString();
            const strOutputFunc = (pointer: number) => StringMap.get(stringMap)(pointer);

            return columnInfo.map(
                (columnDesc) => {
                    if (ColumnDesc.isNumeric(columnDesc)) {
                        return numOutputFunc;
                    }

                    if (ColumnDesc.isString(columnDesc)) {
                        return strOutputFunc;
                    }

                    return Util.throwErr(new Error(`ColumnInfo: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
                }
            );
        })();

        // Append name of output column to end of header array
        const outputColumnFormat = config["name-format"];
        const newHeaders: SourceRecord.RawValue[] = headers.concat([outputColumnFormat.field]);

        // Output column value formatter function
        const outputColumnValue =
            (format: string) =>
                (partitionIndex: number) => {
                    const partitionStr = (partitionIndex + 1).toString();

                    return (setIndex: number) => {
                        return format
                            .replace("%0", partitionStr)
                            .replace("%1", (setIndex + 1).toString());
                    }
                }


        // Map output
        const outputRecordSet =
            results
                .map(threadOutput => Anneal.getPartition(threadOutput))
                .map(
                (partition, partitionIndex) => {
                    const appliedOutputColumnValue = outputColumnValue(outputColumnFormat.format)(partitionIndex);

                    return partition.reduce(
                        (arr, recordSet, setIndex) => {
                            // Modify records to map strings and insert output column
                            recordSet.forEach(
                                (record) => {
                                    // Map back values into strings (incl. numbers) for output to CSV
                                    columnValueRegenerators.forEach(
                                        (outputFunc, i) => {
                                            const valOrPointer = SourceRecord.get(record)(i);
                                            // TODO: Fix type mismatch/function abuse to store string into Record
                                            SourceRecord.set(record)(i)(outputFunc(valOrPointer) as any);
                                        }
                                    );

                                    // Add output column value
                                    // TODO: Fix type mismatch
                                    record.push(appliedOutputColumnValue(setIndex) as any);
                                }
                            );

                            return arr.concat(recordSet);
                        },
                        [] as SourceRecordSet.SourceRecordSet
                    );
                })
                .reduce(
                (arr, recordSet) => {
                    return arr.concat(recordSet)
                },
                []
                );

        console.log("Output record set can be found in global: `__outputRecordSet`");
        (<any>window)["__outputRecordSet"] = outputRecordSet;

        const outCsvText = Papa.unparse({
            fields: newHeaders,
            data: outputRecordSet,
        });

        const outCsvBlob = new Blob([outCsvText], { type: "text/csv;charset=utf-8" });

        saveAs(outCsvBlob, `${csvFile.name}.annealed.csv`, true);
    },

    onPerformAnnealButtonClick: async () => {
        // Parse the files
        const csvFile = csvFileInput.files![0];
        const csvParseResult = await new Promise<PapaParse.ParseResult>((resolve, _reject) => {
            Papa.parse(csvFile, {
                dynamicTyping: true,
                header: false,
                complete: resolve,
            });
        });

        const rawRecords: (string | number)[][] = csvParseResult.data;

        // TODO: Should check for string-iness
        const headers: string[] = rawRecords.shift() as string[];

        const configFile = configFileInput.files![0];
        const configReadResult = await new Promise<Event>((resolve, _reject) => {
            const configReader = new FileReader();
            configReader.onload = resolve;
            configReader.readAsText(configFile);
        });

        const configText = (configReadResult.target as any).result;
        const config: Config.Root = JSON.parse(configText);

        // Find partition generation information
        const level = config.levels[config.levels.length - 1];
        const minSize = level.size.min;
        const idealSize = level.size.ideal;
        const maxSize = level.size.max;

        let partitionColumnIndex: number | undefined = headers.indexOf(config.partition!);
        if (partitionColumnIndex < 0) {
            partitionColumnIndex = undefined;
        }

        // Prepare
        const stringMap = teamAnneal.prepareStringMap();
        const { columnInfo, records } = teamAnneal.prepareColumnInfoAndRecords(stringMap)(headers)(rawRecords);
        const constraints = teamAnneal.prepareConstraints(stringMap)(headers)(config.constraints);
        const partitions = teamAnneal.preparePartitions(partitionColumnIndex)(minSize)(idealSize)(maxSize)(records);

        let numberOfThreads = teamAnneal.estimateThreadsToUse();

        if (!numberOfThreads) {
            // Prompt for number of threads if we can't estimate
            const threadNumString = prompt("Enter number of threads", "1");

            if (!threadNumString) {
                return;
            }

            numberOfThreads = Math.max(1, parseInt(threadNumString) >>> 0);
        }



        // Run
        const timerStart = Util.timer();
        const results = await teamAnneal.annealThreaded(columnInfo)(constraints)(partitions)(numberOfThreads);

        const execTime = Util.timer(timerStart);
        const threadTime = results.reduce((acc, x) => acc + x.time.executionMs, 0);

        console.log("-----");
        console.log(`Total exec time: ${execTime / 1000}s`);
        console.log(`Total thread time: ${threadTime / 1000}s`);
        console.log(`Threading speedup: ${threadTime / execTime}`);
        console.log("-----");
        console.log("Results can be found in global: `__results`");

        (<any>window)["__results"] = results;











        // Export


        // Precompute mapping functions needed per column
        const columnValueRegenerators = (() => {
            const numOutputFunc = (val: number) => Util.isNaN(val) ? "" : val.toString();
            const strOutputFunc = (pointer: number) => StringMap.get(stringMap)(pointer);

            return columnInfo.map(
                (columnDesc) => {
                    if (ColumnDesc.isNumeric(columnDesc)) {
                        return numOutputFunc;
                    }

                    if (ColumnDesc.isString(columnDesc)) {
                        return strOutputFunc;
                    }

                    return Util.throwErr(new Error(`ColumnInfo: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
                }
            );
        })();

        // Append name of output column to end of header array
        const outputColumnFormat = config["name-format"];
        const newHeaders: SourceRecord.RawValue[] = headers.concat([outputColumnFormat.field]);

        // Output column value formatter function
        const outputColumnValue =
            (format: string) =>
                (partitionIndex: number) => {
                    const partitionStr = (partitionIndex + 1).toString();

                    return (setIndex: number) => {
                        return format
                            .replace("%0", partitionStr)
                            .replace("%1", (setIndex + 1).toString());
                    }
                }


        // Map output
        const outputRecordSet =
            results
                .map(threadOutput => Anneal.getPartition(threadOutput.result))
                .map(
                (partition, partitionIndex) => {
                    const appliedOutputColumnValue = outputColumnValue(outputColumnFormat.format)(partitionIndex);

                    return partition.reduce(
                        (arr, recordSet, setIndex) => {
                            // Modify records to map strings and insert output column
                            recordSet.forEach(
                                (record) => {
                                    // Map back values into strings (incl. numbers) for output to CSV
                                    columnValueRegenerators.forEach(
                                        (outputFunc, i) => {
                                            const valOrPointer = SourceRecord.get(record)(i);
                                            // TODO: Fix type mismatch/function abuse to store string into Record
                                            SourceRecord.set(record)(i)(outputFunc(valOrPointer) as any);
                                        }
                                    );

                                    // Add output column value
                                    // TODO: Fix type mismatch
                                    record.push(appliedOutputColumnValue(setIndex) as any);
                                }
                            );

                            return arr.concat(recordSet);
                        },
                        [] as SourceRecordSet.SourceRecordSet
                    );
                })
                .reduce(
                (arr, recordSet) => {
                    return arr.concat(recordSet)
                },
                []
                );

        console.log("Output record set can be found in global: `__outputRecordSet`");
        (<any>window)["__outputRecordSet"] = outputRecordSet;

        const outCsvText = Papa.unparse({
            fields: newHeaders,
            data: outputRecordSet,
        });

        const outCsvBlob = new Blob([outCsvText], { type: "text/csv;charset=utf-8" });

        saveAs(outCsvBlob, `${csvFile.name}.annealed.csv`, true);
    },

    onKillThreads: () => {
        (threads || []).forEach(thread => thread.terminate());
    },
};

// Configure button
performAnneal.onclick = teamAnneal.onPerformAnnealButtonClick;
performAnnealSingleThread.onclick = teamAnneal.onPerformAnnealSingleThreadButtonClick;
killThreads.onclick = teamAnneal.onKillThreads;

// Make it global under `__teamAnneal`
(<any>window)["__teamAnneal"] = teamAnneal;

