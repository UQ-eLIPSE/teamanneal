import * as Stratum from "../../../common/Stratum";
import * as GroupDistribution from "../../../common/GroupDistribution";

import * as ListCounter from "./ListCounter";

export interface Stratum extends Stratum.Desc {
    _id: string,
    counter: ListCounter.ListCounterType | ReadonlyArray<string>,
}

export interface Update {
    stratum: Stratum,
}

export function isSizeMinGreaterThanIdeal(stratum: Stratum) {
    return stratum.size.min > stratum.size.ideal;
}

export function isSizeIdealGreaterThanMax(stratum: Stratum) {
    return stratum.size.ideal > stratum.size.max;
}

export function isSizeMinLessThanOne(stratum: Stratum) {
    return stratum.size.min < 1;
}

export function isSizeMinNotUint32(stratum: Stratum) {
    const val = stratum.size.min;
    return val >>> 0 !== val;
}

export function isSizeIdealNotUint32(stratum: Stratum) {
    const val = stratum.size.ideal;
    return val >>> 0 !== val;
}

export function isSizeMaxNotUint32(stratum: Stratum) {
    const val = stratum.size.max;
    return val >>> 0 !== val;
}

export function isSizeMinEqualToMax(stratum: Stratum) {
    return stratum.size.min === stratum.size.max;
}

/**
 * Generates array where each element is the group size distribution of each 
 * stratum as provided to the function
 */
export function generateStrataGroupSizes(strata: ReadonlyArray<Stratum>, numMembersInPartition: number) {
    const numberOfStrata = strata.length;

    // Iterate over strata and build up distribution
    const strataGroupSizeDistributions: number[][] = [];

    // Initial number of nodes = number of records in partition at first
    let numberOfStratumNodes = numMembersInPartition;

    // TODO: Fix up the internal strata object order (TA-58)
    for (let i = numberOfStrata - 1; i >= 0; --i) {
        const stratum = strata[i];
        const { min, ideal, max } = stratum.size;

        const groupSizeArray = GroupDistribution.generateGroupSizes(numberOfStratumNodes, min, ideal, max, false);

        strataGroupSizeDistributions.unshift(groupSizeArray);

        // Next stratum up contains the nodes as described by the group size
        // array above
        numberOfStratumNodes = groupSizeArray.length;
    }

    return strataGroupSizeDistributions;
}
