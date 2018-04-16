import * as GroupDistribution from "../../../common/GroupDistribution";

import { reverse } from "../util/Array";

export interface StratumSize {
    min: number,
    ideal: number,
    max: number,
}

export function initNew(min: number = 0, ideal: number = 0, max: number = 0) {
    const obj: StratumSize = {
        min,
        ideal,
        max,
    };

    return obj;
}

export function isSizeMinGreaterThanIdeal(size: StratumSize) {
    return size.min > size.ideal;
}

export function isSizeIdealGreaterThanMax(size: StratumSize) {
    return size.ideal > size.max;
}

export function isSizeMinLessThanOne(size: StratumSize) {
    return size.min < 1;
}

export function isSizeMinNotUint32(size: StratumSize) {
    const val = size.min;
    return val >>> 0 !== val;
}

export function isSizeIdealNotUint32(size: StratumSize) {
    const val = size.ideal;
    return val >>> 0 !== val;
}

export function isSizeMaxNotUint32(size: StratumSize) {
    const val = size.max;
    return val >>> 0 !== val;
}

export function isSizeMinEqualToMax(size: StratumSize) {
    return size.min === size.max;
}

/**
 * Generates array where each element is the group size distribution of each 
 * stratum as provided to the function
 * 
 * @param {ReadonlyArray<StratumSize>} strataSizes An array of the size objects 
 * for each stratum, in the order that they're defined in the `StrataConfig` 
 * stratum array ([highest, ..., lowest])
 * 
 * @param {number} members Total number of members to consider for the group 
 * size distribution calculation (generally, this number should represent one 
 * partition's total number of records)
 */
export function generateStrataGroupSizes(strataSizes: ReadonlyArray<StratumSize>, members: number) {
    // Iterate over strata and build up distribution
    const strataGroupSizeDistributions: number[][] = [];

    // Initial number of nodes at first is:
    // = number of leaf nodes
    // = number of members (records in partition)
    let numberOfStratumNodes = members;

    // We get the strata in reverse order because the internal
    // strata object is currently ordered:
    //      [highest, ..., lowest]
    // rather than:
    //      [lowest, ..., highest]
    // which is the order we build up groups from.
    reverse(strataSizes).forEach(({ min, ideal, max }) => {
        const groupSizeArray = GroupDistribution.generateGroupSizes(numberOfStratumNodes, min, ideal, max, false);

        // We push this from the START of the array to mirror the order of the
        // original input `strataSizes`
        strataGroupSizeDistributions.unshift(groupSizeArray);

        // Next stratum up contains the nodes as described by the group size
        // array above
        numberOfStratumNodes = groupSizeArray.length;
    });

    return strataGroupSizeDistributions;
}
