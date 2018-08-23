import * as Iteration from "./Iteration";
import * as CostCompute from "./CostCompute";
import * as MutationOperation from "./MutationOperation";
import * as TemperatureDerivation from "./TemperatureDerivation";

import { AnnealStratum } from "../data/AnnealStratum";
import { AnnealRecordPointerArray } from "../data/AnnealRecordPointerArray";
import { Config } from "../utils/Config";

/**
 * Derives starting temperature.
 */
export function derive(recordPointers: AnnealRecordPointerArray, strata: ReadonlyArray<AnnealStratum>) {
    const annealConfig = Config.get().anneal;
    const tempDerSamples = annealConfig.temperatureDerivation.numberOfSamples;

    // We define a maximum number of iterations to run for deriving the starting
    // temperature because some anneal configurations may have few uphill costs
    // being accumulated, leading to a long running derivation loop or even
    // infinite loops
    const maximumLoopIterations = annealConfig.temperatureDerivation.maxLoopIterations >>> 0;
    let loopIterationCount = 0;

    // Preserve the initial state
    recordPointers.saveToStoreA();

    // Temperature derivation object
    const tempDer = TemperatureDerivation.init(tempDerSamples);

    // Running cost for temperature derivation process
    let tempDerCurrentCost: number | undefined = undefined;

    while (!TemperatureDerivation.isReadyForDerivation(tempDer)) {
        // NOTE: We do not care about resetting state on every loop;
        // this is the same for the original TeamAnneal code as it
        // continuously runs moves without regard for restoring the
        // previous/original state

        // Perform random op
        //
        // We only need to mutate the leaf nodes (swap, move, etc.)
        // This is done via the immediate parent of records - the lowest/leaf
        // stratum nodes (index = 0)
        const modifiedPointerIndicies = MutationOperation.randPick()(strata[0]);

        // Wipe costs on nodes with modified record pointers
        CostCompute.wipeCost(strata, modifiedPointerIndicies);

        // Calculate cost
        const newCost = CostCompute.computeCost(strata);

        // Assign cost at start
        if (tempDerCurrentCost === undefined) {
            tempDerCurrentCost = newCost;
            continue;
        }

        // Only accumulate uphill cost differences to the temperature
        // derivation object
        const costDiff = Iteration.calculateCostDifference(tempDerCurrentCost, newCost);

        if (costDiff > 0) {
            TemperatureDerivation.pushCostDelta(tempDer, costDiff);
        }

        // Update the new current cost, as we don't reset the state
        tempDerCurrentCost = newCost;

        // Throw when maximum number of iterations reached
        if (++loopIterationCount >= maximumLoopIterations) {
            throw new Error(`Maximum number of iterations reached in starting temperature derivation loop; ${tempDer.costArray.length} of ${tempDer.size} slots filled`);
        }
    }

    // Derive the starting temperature
    const startTemp = TemperatureDerivation.deriveTemperature(tempDer);

    // Restore root node to original state before we exit
    recordPointers.loadFromStoreA();

    // You must wipe costs when reloading from store
    CostCompute.wipeAllCost(strata);

    return startTemp;
}
