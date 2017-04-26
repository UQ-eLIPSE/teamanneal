/*
 * AnnealRound
 * 
 * 
 */
import * as Partition from "./Partition";
import * as Util from "./Util";
import * as AnnealOperation from "./AnnealOperation";
import * as CostFunction from "./CostFunction";
import * as SourceRecordSet from "./SourceRecordSet";



export interface AnnealRoundResult extends ReadonlyArray<Partition.Partition | number> {
    /** partition */        0: Partition.Partition,
    /** cost */             1: number,
    /** costDiff */         2: number,
    /** accepted */         3: number,
}





const __getter = <T>(i: number) => (r: AnnealRoundResult): T => (r as any)[i];

export const getPartition = __getter<Partition.Partition>(0);
export const getCost = __getter<number>(1);
export const getCostDiff = __getter<number>(2);
export const getAccepted = __getter<number>(3);




export const newAnnealRound =
    (appliedRecordSetCostFunctions: CostFunction.AppliedRecordSetCostFunction[]) =>
        (prevPartition: Partition.Partition) =>
            (prevCost: number) =>
                (prevTemp: number) => {
                    // Perform operation
                    const annealOperation = AnnealOperation.pickRandomAnnealOperation();

                    // Partition MUST be copied, otherwise you'll be mutating the object coming in
                    const prevPartitionCopy = prevPartition.map(
                        // Only shallow copying record sets because we don't touch the record content
                        recordSet => SourceRecordSet.shallowCopy(recordSet)
                    );
                    const partition = annealOperation(prevPartitionCopy);

                    // Pick apart the result
                    const cost = partition.reduce(
                        (cost, recordSet) => {
                            return cost +
                                CostFunction.getCostUsingAppliedRecordSetCostFunctions(appliedRecordSetCostFunctions)(recordSet);
                        },
                        0
                    );
                    const costDiff = calculateCostDifference(prevCost)(cost);

                    // Check acceptance
                    const accepted = Util.boolToInt(isNewCostAcceptable(prevTemp)(prevCost)(cost));

                    const output: AnnealRoundResult = [
                        partition,
                        cost,
                        costDiff,
                        accepted,
                    ];

                    return output;
                }

const calculateCostDifference =
    (prevCost: number) =>
        (newCost: number) => {
            return newCost - prevCost;
        }

const isNewCostBetter =
    (prevCost: number) =>
        (newCost: number) => {
            // We should expect to go down in cost if solutions are better
            return calculateCostDifference(prevCost)(newCost) < 0;
        }

const isNewCostAcceptable =
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

const shouldWeAcceptNewBadCost =
    (prevTemp: number) =>
        (prevCost: number) =>
            (newCost: number) => {
                const costDiff = calculateCostDifference(prevCost)(newCost);

                const acceptProbability = Math.exp(-costDiff / prevTemp);
                const testThreshold = Util.randFloat64();

                // Over time, it becomes less likely that the random test threshold
                // will result in the system accepting bad rounds
                return testThreshold < acceptProbability;
            }

export const isAccepted =
    (result: AnnealRoundResult) => Util.intToBool(getAccepted(result));
