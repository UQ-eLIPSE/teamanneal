import * as Util from "../core/Util";

/** Temperature scaling factor for every new iteration */
const stepTemperatureScaling = 0.98;

/** Tolerance level for temperature equivalence */
const temperatureTolerance: number = 1e-50;

export function calculateCostDifference(prevCost: number, newCost: number) {
    return newCost - prevCost;
}

export function isNewCostAcceptable(prevTemp: number, prevCost: number, newCost: number) {
    // Always accept if round produces better answer (lower cost)
    if (isNewCostBetter(prevCost, newCost)) {
        return true;
    }

    // Otherwise, leave to chance
    return shouldWeAcceptNewBadCost(prevTemp, prevCost, newCost);
}

function isNewCostBetter(prevCost: number, newCost: number) {
    // We should expect to go down in cost if solutions are better
    return calculateCostDifference(prevCost, newCost) < 0;
}

function shouldWeAcceptNewBadCost(prevTemp: number, prevCost: number, newCost: number) {
    const costDiff = calculateCostDifference(prevCost, newCost);

    const acceptProbability = Math.exp(-costDiff / prevTemp);
    const testThreshold = Util.randFloat64();

    // Over time, it becomes less likely that the random test threshold
    // will result in the system accepting bad rounds
    return testThreshold < acceptProbability;
}

export function calculateNewTemperature(temp: number) {
    return temp * stepTemperatureScaling;
}

export function isTemperatureExhausted(temp: number) {
    return temp < temperatureTolerance;
}

export function isResultPerfect(cost: number) {
    return cost === 0;
}
