export interface TemperatureDerivation {
    readonly costArray: ReadonlyArray<number>,
    readonly size: number,
}

interface TemperatureDerivationUnsafe {
    costArray: number[],
    size: number,
}

/** 
 * This is a reference prototype so that some JavaScript engines can better
 * optimise property lookups against all UphillTrackers.
 * 
 * This seems to be particularly true of V8 (Chrome/Node.js).
 */
const __rootPrototype = Object.create(null);

export function init(size: number) {
    const td: TemperatureDerivationUnsafe = Object.create(__rootPrototype);

    td.costArray = [];
    td.size = size;

    return td as TemperatureDerivation;
}

export function pushCostDelta(temperatureDerivation: TemperatureDerivation, costDelta: number) {
    const td = temperatureDerivation as TemperatureDerivationUnsafe;
    td.costArray.push(costDelta);
    return td as TemperatureDerivation;
}

export function isReadyForDerivation(td: TemperatureDerivation) {
    return td.costArray.length === td.size;
}

export function deriveTemperature(td: TemperatureDerivation) {
    const costs = td.costArray.slice();
    const size = td.size;

    // Use cost at 90th percentile for temperature calculation
    const cost90thPc = costs.sort()[(size * 0.9) >>> 0];

    // Cost should be permitted at 70% probability
    return -cost90thPc / Math.log(0.7);
}
