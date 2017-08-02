import * as GroupDistribution from "../../../common/GroupDistribution";

import * as UUID from "../util/UUID";

import { ListCounterType } from "./ListCounter";

export interface Data {
    _id: string,

    label: string,
    size: Size,
    counter: ListCounterType | string[],
}

export interface Size {
    min: number,
    ideal: number,
    max: number,
}

export namespace Stratum {
    export function Init(
        label: string,
        size: Size,
        counter: ListCounterType | string[] = "decimal",
    ) {
        const data: Data = {
            _id: UUID.generate(),
            label,
            size,
            counter,
        };

        return data;
    }

    export function Equals(a: Data, b: Data) {
        return a._id === b._id;
    }

































    export function IsSizeMinGreaterThanIdeal(stratum: Data) {
        return stratum.size.min > stratum.size.ideal;
    }

    export function IsSizeIdealGreaterThanMax(stratum: Data) {
        return stratum.size.ideal > stratum.size.max;
    }

    export function IsSizeMinLessThanOne(stratum: Data) {
        return stratum.size.min < 1;
    }

    export function IsSizeMinNotUint32(stratum: Data) {
        const val = stratum.size.min;
        return val >>> 0 !== val;
    }

    export function IsSizeIdealNotUint32(stratum: Data) {
        const val = stratum.size.ideal;
        return val >>> 0 !== val;
    }

    export function IsSizeMaxNotUint32(stratum: Data) {
        const val = stratum.size.max;
        return val >>> 0 !== val;
    }

    export function IsSizeMinEqualToMax(stratum: Data) {
        return stratum.size.min === stratum.size.max;
    }

    /**
     * Generates array where each element is the group size distribution of each 
     * stratum as provided to the function
     */
    export function GenerateStrataGroupSizes(strata: ReadonlyArray<Data>, numMembersInPartition: number) {
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



























}
