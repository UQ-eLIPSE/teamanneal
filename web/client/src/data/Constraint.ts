import * as Constraint from "../../../common/Constraint";

import { deepClean } from "../util/Object";

export type Constraint = { _id: number } & Constraint.Desc;

export interface Update {
    constraint: Constraint,
}

/**
 * Cleans out unnecessary object properties for constraints
 */
export function cleanObject(obj: Constraint.Desc) {
    let definition: Object;

    switch (obj.type) {
        case "limit": {
            definition = ObjectDefinitions.Limit;
            break;
        }
        case "count": {
            definition = ObjectDefinitions.Count;
            break;
        }
        case "similarity": {
            definition = ObjectDefinitions.Similarity;
            break;
        }
        default: {
            throw new Error("Unknown constraint type");
        }
    }

    deepClean(obj, definition);

    return obj;
}

// Object definitions for Constraint objects for use at runtime
namespace ObjectDefinitions {
    const _ = true;

    export const Limit = {
        type: _,
        strata: _,
        weight: _,
        filter: {
            column: _,
            function: _,
            values: _
        },
        condition: {
            function: _,
        },
        applicability: _,
    }


    export const Count = {
        type: _,
        strata: _,
        weight: _,
        filter: {
            column: _,
            function: _,
            values: _
        },
        condition: {
            function: _,
            value: _,
        },
        applicability: _,
    }


    export const Similarity = {
        type: _,
        strata: _,
        weight: _,
        filter: {
            column: _,
        },
        condition: {
            function: _,
        },
        applicability: _,
    }
}
