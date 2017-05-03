/*
 * Anneal
 * 
 * 
 */
import * as SourceRecordSet from "./SourceRecordSet";
import * as Partition from "./Partition";
import * as AnnealRound from "./AnnealRound";
import * as CostFunction from "./CostFunction";

import * as Util from "../core/Util";





export const temperatureTolerance: number = 1e-50;

export const defaultTestTemperatureAttempts: number = 200;
export const defaultStepIterationScalar: number = 4;
export const defaultStepTemperatureScaling = 0.98;

export const defaultAvgUphillProbabilityThreshold: number = 0.0025;
export const defaultAvgProbabilityWindowSize: number = 8;





export const calculateNewTemperature =
    (currTemp: number) => defaultStepTemperatureScaling * currTemp;

export const guessStartingTemperature =
    (appliedRecordSetCostFunctions: CostFunction.AppliedRecordSetCostFunction[]) =>
        (partition: Partition.Partition) =>
            (testAttempts: number) => {
                // Try out attempts and keep track of costs
                const performRound = () => AnnealRound.newAnnealRound(appliedRecordSetCostFunctions)(partition)(0)(0);

                const costs = Util.blankArray(testAttempts).map(
                    () => {
                        // Only consider costs which are non-zero
                        let costDiff: number;

                        do {
                            costDiff = AnnealRound.getCostDiff(performRound());
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
    (appliedRecordSetCostFunctions: CostFunction.AppliedRecordSetCostFunction[]) =>
        (startPartition: Partition.Partition) =>
            (startCost: number) =>
                (startTemp: number) =>
                    (iterations: number) => {
                        // Copying variables for mutable use and shortening names 
                        let p = startPartition;     // partition
                        let $ = startCost;          // cost
                        let T = startTemp;          // temperature

                        // Create function for performing round
                        const performRound = AnnealRound.newAnnealRound(appliedRecordSetCostFunctions);

                        // Run iterations
                        return Util.blankArray(iterations).map(() => {
                            // Perform round
                            const roundResult = performRound(p)($)(T);

                            // If accepted, update state
                            const accepted = AnnealRound.isAccepted(roundResult);
                            if (accepted) {
                                p = AnnealRound.getPartition(roundResult);
                                $ = AnnealRound.getCost(roundResult);
                            }

                            // Always decrease temperature with every iteration
                            T = calculateNewTemperature(T);

                            const costDiff = AnnealRound.getCostDiff(roundResult);

                            const output: AnnealIterationResult = [
                                p,
                                $,
                                costDiff,
                                Util.boolToInt(accepted),
                                T,
                            ];

                            return output;
                        });
                    }

export const getLastAcceptedFromIterations =
    (iterationResults: AnnealIterationResult[]) => {
        let i = iterationResults.length - 1;

        if (i < 0) {
            throw new Error("Anneal: Iteration results must be non-empty");
        }

        let result: AnnealIterationResult | undefined;

        while (i--) {
            result = iterationResults[i];

            // Return last accepted in iteration result set
            if (isAccepted(result)) {
                return result;
            }
        }

        // If none accepted, we get the first in the iteration
        return result!;
    }

export const run =
    (appliedRecordSetCostFunctions: CostFunction.AppliedRecordSetCostFunction[]) =>
        (startPartition: Partition.Partition): AnnealIterationResult => {
            // Copying variables and shortening names
            const f = appliedRecordSetCostFunctions;// pre-applied record set cost functions
            let p = startPartition;                 // partition
            const numRecords =                      // number of records in partition
                p.reduce((acc, recordSet) => acc + SourceRecordSet.size(recordSet), 0);
            let $ = 0;                              // cost
            let T =                                 // temperature
                guessStartingTemperature(f)(p)(defaultTestTemperatureAttempts);

            let numOfAcceptedUphill: number = 0;
            let numOfUphill: number = 0;
            const uphillAcceptanceProbabilityWindow: number[] =
                Util.initArray(1)(defaultAvgProbabilityWindowSize);

            let bestResult: AnnealIterationResult | undefined;
            let itScalar: number = defaultStepIterationScalar;  // iteration number scalar for next round

            // Set up helper functions

            /**
             * @return {boolean} Whether the input result was considered "best" (lowest cost) so far
             */
            const updateBestResult =
                (result: AnnealIterationResult) => {
                    // If best result does not exist or this result is better; update
                    if (!bestResult || getCost(result) < getCost(bestResult)) {
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
                (iterationResults: AnnealIterationResult[]) => {
                    iterationResults.forEach(
                        (iterationResult) => {
                            // Only consider uphill
                            if (getCostDiff(iterationResult) <= 0) {
                                return;
                            }

                            // Accumulate accepted/total uphill figures
                            if (isAccepted(iterationResult)) {
                                ++numOfAcceptedUphill;
                            }

                            ++numOfUphill;
                        }
                    );

                    // Also update the window while we're here
                    updateUphillAcceptanceProbabilityWindow(getUphillAcceptanceRate());

                    // return [numOfAcceptedUphill, numOfUphill];
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
            const iterate = performIterations(f);

            // Main annealing iteration loop
            while (true) {
                // Run iterations
                const iterationResults = iterate(p)($)(T)(numRecords * itScalar);
                
                // We get the last accepted result from the iteration run
                const endResult = getLastAcceptedFromIterations(iterationResults);

                // Determine if end result was best so far; update state accordingly
                const endResultWasBest = updateBestResult(endResult);

                if (endResultWasBest) {
                    p = getPartition(endResult);
                    $ = getCost(endResult);
                }

                // Update temperature from iterations
                T = getTemperature(endResult);

                // If we're already at cost or temp = 0 then stop
                if ($ === 0 || T < temperatureTolerance) {
                    return bestResult!;
                }

                // Update uphill acceptance info
                updateUphillAcceptanceStats(iterationResults);

                // Stop if we're very unlikely to get anywhere uphill in future
                const avgUphillProbability = getAvgWindowUphillAcceptanceProbability();

                if (avgUphillProbability < defaultAvgUphillProbabilityThreshold) {
                    return bestResult!;
                }

                // Set iteration scalar depending on uphill acceptance rate
                const uphillAcceptanceRate = getUphillAcceptanceRate();


                // TODO: Acceptance thresholds/scalars should be
                //       extracted into own variables
                if (uphillAcceptanceRate > 0.7 || uphillAcceptanceRate < 0.2) {
                    itScalar = 4;
                } else if (uphillAcceptanceRate > 0.6 || uphillAcceptanceRate < 0.3) {
                    itScalar = 8;
                } else {
                    itScalar = 32;
                }
            }

        }







export interface AnnealIterationResult extends ReadonlyArray<Partition.Partition | number> {
    /** partition */        0: Partition.Partition,
    /** cost */             1: number,
    /** costDiff */         2: number,
    /** accepted */         3: number,
    /** temperature */      4: number,

}

const __getter = <T>(i: number) => (r: AnnealIterationResult): T => (r as any)[i];
// const __setter = <T>(i: number) => (r: AnnealIterationResult) => (val: T): T => (r as any)[i] = val;

export const getPartition = __getter<Partition.Partition>(0);
export const getCost = __getter<number>(1);
export const getCostDiff = __getter<number>(2);
export const getAccepted = __getter<number>(3);
export const getTemperature = __getter<number>(4);

export const isAccepted =
    (result: AnnealIterationResult) => Util.intToBool(getAccepted(result));
