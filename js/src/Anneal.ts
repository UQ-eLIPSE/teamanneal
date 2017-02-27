import * as Config from "./Config";

import * as Constraint from "./Constraint";
import * as Partition from "./Partition";

import * as Util from "./Util";

import * as AnnealRound from "./AnnealRound";




export interface AnnealRunResult {
    history: ReadonlyArray<ReadonlyArray<AnnealRound.AnnealRound>>,
    result: AnnealRound.AnnealRound,
}




export const temperatureTolerance: number = 1e-50;

export const defaultTestTemperatureAttempts: number = 200;
export const defaultStepIterationScalar: number = 4;
export const defaultStepTemperatureScaling = 0.98;

export const defaultAvgUphillProbabilityThreshold: number = 0.0025;
export const defaultAvgProbabilityWindowSize: number = 8;

export const calculateNewTemperature =
    (currTemp: number) => defaultStepTemperatureScaling * currTemp;

export const guessStartingTemperature =
    (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) =>
        (partition: Partition.PartitionWithGroup) =>
            (testAttempts: number) => {
                // Try out attempts and keep track of costs
                const performRound = () => AnnealRound.newAnnealRound(constraints)(partition)(0)(0);

                const costs = Util.blankArray(testAttempts).map(
                    () => {
                        // Only consider costs which are non-zero
                        let costDiff: number;

                        do {
                            costDiff = performRound().costDiff;
                        } while (costDiff === 0);

                        return costDiff;
                    }
                );

                // TODO: Extract the parameters to (n)th percentile
                //       and the probability threshold

                // Use cost at 90th percentile
                const cost90thPc = costs.sort()[Util.int32(testAttempts * 0.9)];

                // Cost should be permitted at 70% probability??
                return -cost90thPc / Math.log(0.7);
            }

export const performIterations =
    (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) =>
        (startPartition: Partition.PartitionWithGroup) =>
            (startCost: number) =>
                (startTemp: number) =>
                    (iterations: number) => {
                        // Copying variables for mutable use and shortening names 
                        let p = startPartition;     // partition
                        let $ = startCost;          // cost
                        let T = startTemp;          // temperature

                        // Create function for performing round
                        const performRound = AnnealRound.newAnnealRound(constraints);

                        // Return array of results
                        return Util.blankArray(iterations).map(
                            () => {
                                // Perform round
                                const result = performRound(p)($)(T);

                                // If accepted, update state
                                if (result.accepted) {
                                    p = result.partition;
                                    $ = result.cost;
                                    T = calculateNewTemperature(T)
                                }

                                return result;
                            }
                        );
                    }

export const run =
    (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) =>
        (startPartition: Partition.PartitionWithGroup): AnnealRunResult => {
            // Copying variables and shortening names
            const c = constraints;                  // constraints
            let p = startPartition;                 // partition
            const numRecords = p.records.length;    // number of records in partition
            let $ = 0;                              // cost
            let T =                                 // temperature
                guessStartingTemperature(c)(p)(defaultTestTemperatureAttempts);

            let numOfAcceptedUphill: number = 0;
            let numOfUphill: number = 0;
            const uphillAcceptanceProbabilityWindow: number[] =
                Util.initArray(1)(defaultAvgProbabilityWindowSize);

            let bestResult: AnnealRound.AnnealRound | undefined;
            let resultHistory: AnnealRound.AnnealRound[][] = [];
            let itScalar: number = defaultStepIterationScalar;  // iteration number scalar for next round

            // Set up helper functions

            /**
             * @return {boolean} Whether the input result was considered "best" (lowest cost) so far
             */
            const updateBestResult =
                (result: AnnealRound.AnnealRound) => {
                    // If best result does not exist or this result is better; update

                    if (!result) {
                        return false;
                    }

                    if (!bestResult || result.cost < bestResult.cost) {
                        bestResult = result;
                        return true;
                    }

                    return false;
                }

            const updateUphillAcceptanceProbabilityWindow =
                (p: number) => {
                    uphillAcceptanceProbabilityWindow.shift();
                    uphillAcceptanceProbabilityWindow.push(p);
                }

            const getAvgWindowUphillAcceptanceProbability =
                () => Util.avg(uphillAcceptanceProbabilityWindow);

            /**
             * @return {number[]} [number of accepted uphill rounds, number of total uphill rounds]
             */
            const updateUphillAcceptanceStats =
                (iterationResults: AnnealRound.AnnealRound[]) => {
                    iterationResults.forEach(
                        (round) => {
                            // Only consider uphill
                            if (round.costDiff <= 0) {
                                return;
                            }

                            // Accumulate accepted/total uphill figures
                            if (round.accepted) {
                                ++numOfAcceptedUphill;
                            }

                            ++numOfUphill;
                        }
                    );

                    // Also update the window while we're here
                    updateUphillAcceptanceProbabilityWindow(getUphillAcceptanceRate());

                    return [numOfAcceptedUphill, numOfUphill];
                }

            const getUphillAcceptanceRate =
                () => {
                    // No data => DIV/0 = Infinity :(
                    if (numOfUphill === 0) {
                        return 1;
                    }

                    return numOfAcceptedUphill / numOfUphill;
                }


            // Curry the iteration function with constant constraints
            const iterate = performIterations(c);

            // Main annealing iteration loop
            while (true) {
                // Run iterations
                const iterationResults = iterate(p)($)(T)(numRecords * itScalar);
                const endResult = iterationResults[iterationResults.length - 1];

                resultHistory.push(iterationResults);

                // Determine if end result was best so far; update state accordingly
                const endResultWasBest = updateBestResult(endResult);

                if (endResultWasBest) {
                    p = endResult.partition;
                    $ = endResult.cost;
                }

                // Temperature is always updated
                // (unless you miraculously gained energy somewhere)
                T = calculateNewTemperature(endResult.startTemperature);

                // If we're already at cost or temp = 0 then stop
                if ($ === 0 || T < temperatureTolerance) {
                    return {
                        history: resultHistory,
                        result: bestResult!,        // TODO: Check `bestResult` undefinedness
                    };
                }

                // Update uphill acceptance info
                updateUphillAcceptanceStats(iterationResults);

                // Stop if we're very unlikely to get anywhere uphill in future
                const avgUphillProbability = getAvgWindowUphillAcceptanceProbability();

                if (avgUphillProbability < defaultAvgUphillProbabilityThreshold) {
                    return {
                        history: resultHistory,
                        result: bestResult!,        // TODO: Check `bestResult` undefinedness
                    };
                }

                // Set iteration scalar depending on uphill acceptance rate
                const uphillAcceptanceRate = getUphillAcceptanceRate();

                if (uphillAcceptanceRate > 0.7 || uphillAcceptanceRate < 0.2) {
                    itScalar = 4;
                } else if (uphillAcceptanceRate > 0.6 || uphillAcceptanceRate < 0.3) {
                    itScalar = 8;
                } else {
                    itScalar = 32;
                }
            }

        }
