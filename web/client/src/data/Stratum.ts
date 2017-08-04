import * as GroupDistribution from "../../../common/GroupDistribution";

import * as UUID from "../util/UUID";
import { reverse } from "../util/Array";

import { ListCounterType } from "./ListCounter";

export interface Data {
    _id: string,

    label: string,
    size: Size,

    namingConfig: {
        /** Definition of the list used for naming nodes in stratum */
        counter: ListCounterType | string[],

        /** 
         * The context under which names are generated
         * 
         * For example:
         * - if set to the global context, names are unique globally
         * - if set to some the parent stratum, names are unique only within the 
         *   parent stratum
         * 
         * Values are either:
         * - stratum object ID (to identify a stratum)
         * - "_PARTITION" literal
         * - "_GLOBAL" literal
         */
        context: string | "_PARTITION" | "_GLOBAL",
    },
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

            namingConfig: {
                counter,
                context: "_GLOBAL",     // TODO: Implement adjustable contexts for naming
            },
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
        // Iterate over strata and build up distribution
        const strataGroupSizeDistributions: number[][] = [];

        // Initial number of nodes = number of records in partition at first
        let numberOfStratumNodes = numMembersInPartition;

        // We get the strata in reverse order because the internal
        // strata object is currently ordered:
        //      [highest, ..., lowest]
        // rather than:
        //      [lowest, ..., highest]
        // which is the order we build up groups from.
        reverse(strata).forEach((stratum) => {
            const { min, ideal, max } = stratum.size;

            const groupSizeArray = GroupDistribution.generateGroupSizes(numberOfStratumNodes, min, ideal, max, false);

            strataGroupSizeDistributions.unshift(groupSizeArray);

            // Next stratum up contains the nodes as described by the group size
            // array above
            numberOfStratumNodes = groupSizeArray.length;
        });

        return strataGroupSizeDistributions;
    }
}
