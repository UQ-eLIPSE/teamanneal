import * as Config from "./Config";

import * as Constraint from "./Constraint";
import * as Partition from "./Partition";

import * as Util from "./Util";
import * as Random from "./Random";

import * as AnnealOperation from "./AnnealOperation";
import * as CostFunction from "./CostFunction";





export interface AnnealRound {
    // readonly temperature: {
    //     start: number,
    //     end: number,
    // }

    readonly startTemperature: number,

    readonly partition: Partition.PartitionWithGroup,
    readonly cost: number,
    readonly costDiff: number,

    readonly operation: {
        readonly name: string,

        readonly startTime: number,
        readonly endTime: number,
        readonly executionMs: number,

        readonly details: AnnealOperation.OpOutputDetail | null,
    }

    readonly time: {
        start: number,
        end: number,
        executionMs: number,
    }

    readonly accepted: boolean,
}





export const newAnnealRound =
    (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) =>
        (prevPartition: Partition.PartitionWithGroup) =>
            (prevCost: number) =>
                (prevTemp: number) => {
                    const timerStart = Util.timer();
                    const startTime = Util.timestamp();

                    // Perform operation
                    const annealOperation = AnnealOperation.pickRandomAnnealOperation();
                    const operationResult = annealOperation(prevPartition);

                    // Pick apart the result
                    const startTemperature = prevTemp;
                    const partition = operationResult.partition;
                    const cost = partition.groups.reduce(
                        (cost, group) => {
                            return cost + CostFunction.calculateCostOfGroup(constraints)(group)
                        },
                        0
                    );
                    const costDiff = calculateCostDifference(prevCost)(cost);

                    // // Calculate new temperature
                    // const remainingTemperature = calculateNewTemperature(startTemperature);

                    // Check acceptance
                    const accepted = isNewCostAcceptable(prevTemp)(prevCost)(cost);


                    const output: AnnealRound = {
                        // temperature: {
                        //     start: startTemperature,
                        //     end: remainingTemperature,
                        // },

                        startTemperature,

                        partition,
                        cost,
                        costDiff,

                        operation: {
                            name: operationResult.name,
                            startTime: operationResult.startTime,
                            endTime: operationResult.endTime,
                            executionMs: operationResult.executionMs,
                            details: operationResult.details,
                        },

                        accepted,

                        time: {
                            start: startTime,
                            end: Util.timestamp(),
                            executionMs: Util.timer(timerStart),
                        }
                    }

                    return output;
                }

export const calculateCostDifference =
    (prevCost: number) =>
        (newCost: number) => {
            return newCost - prevCost;
        }

export const isNewCostBetter =
    (prevCost: number) =>
        (newCost: number) => {
            // We should expect to go down in cost if solutions are better
            return calculateCostDifference(prevCost)(newCost) < 0;
        }

export const isNewCostAcceptable =
    (prevTemp: number) =>
        (prevCost: number) =>
            (newCost: number) => {
                // Always accept if round produces better answer (lower cost)
                if (isNewCostBetter(prevCost)(newCost)) {
                    return true;
                }

                // Otherwise, leave to chance
                return shouldWeAcceptNewBadCost(prevTemp)(prevCost)(newCost);
            }

export const shouldWeAcceptNewBadCost =
    (prevTemp: number) =>
        (prevCost: number) =>
            (newCost: number) => {
                const costDiff = calculateCostDifference(prevCost)(newCost);

                const acceptProbability = Math.exp(-costDiff / prevTemp);
                const testThreshold = Random.generateRandomFloat();

                // Over time, it becomes less likely that the random test threshold
                // will result in the system accepting bad rounds
                return testThreshold < acceptProbability;
            }
