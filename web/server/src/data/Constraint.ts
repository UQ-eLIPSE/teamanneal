import * as Constraint from "../../../common/Constraint";
import { ValueMessageReturn } from "../../../common/ValueMessageReturn";

/**
 * Checks constraint data is valid.
 */
export function checkValidity(constraint: Constraint.Desc): ValueMessageReturn<boolean> {
    /** Returns ValueMessageReturn<false> with specified message */
    const msgFalse = (message: string): ValueMessageReturn<false> =>
        ({
            value: false,
            message,
        });

    if (!isStrataValid(constraint)) {
        return msgFalse("Constraint does not have a valid strata index value");
    }

    if (!isWeightValid(constraint)) {
        return msgFalse("Constraint does not have a valid weight");
    }

    if (!isTypeValid(constraint)) {
        return msgFalse("Constraint does not have a valid type");
    }

    if (!isApplicabilityConditionsArray(constraint)) {
        return msgFalse("Constraint does not have a valid applicability conditions array");
    }

    if (!isFilterFunctionValid(constraint)) {
        return msgFalse("Constraint does not have a valid filter function");
    }

    if (!isFilterSearchValuesNonEmpty(constraint)) {
        return msgFalse("Constraint does not have a search value");
    }

    // Check that constraint (filter function + search values) combos
    // are valid
    if (!isFilterFunctionValidForSearchValues(constraint)) {
        return msgFalse("Constraint is assigned a filter function that is incompatible with the provided search values");
    }

    return {
        value: true,
        message: undefined,
    }
}

export function isStrataValid(constraint: Constraint.Desc) {
    const strataValue = constraint.strata;

    // Strata value must be a numeric index
    if (typeof strataValue !== "number") {
        return false;
    }

    // Indicies must be non-negative
    if (strataValue < 0) {
        return false;
    }

    // Indicies must be integers
    if (strataValue !== (strataValue | 0)) {
        return false;
    }

    return true;
}

export function isWeightValid(constraint: Constraint.Desc) {
    const weightValue = constraint.weight;

    // Strata value must be numeric
    if (typeof weightValue !== "number") {
        return false;
    }

    return true;
}

export function isTypeValid(constraint: Constraint.Desc) {
    // Only return true if it is a valid type value
    switch (constraint.type) {
        case "countable":
        case "limit":
        case "similarity":
            return true;
    }

    return false;
}

export function isApplicabilityConditionsArray(constraint: Constraint.Desc) {
    return Array.isArray(constraint.applicabilityConditions);
}

export function isFilterFunctionValid(constraint: Constraint.Desc) {
    // Ignore similarity type constraints
    if (constraint.type === "similarity") {
        return true;
    }

    // Only return true if it is a valid filter function
    switch (constraint.filter.function) {
        case "eq":
        case "neq":
        case "lt":
        case "lte":
        case "gt":
        case "gte":
            return true;
    }

    return false;
}

export function isFilterSearchValuesNonEmpty(constraint: Constraint.Desc) {
    // Ignore similarity type constraints
    if (constraint.type === "similarity") {
        return true;
    }

    return constraint.filter.searchValues.length !== 0;
}

export function isFilterFunctionValidForSearchValues(constraint: Constraint.Desc) {
    // Ignore similarity type constraints
    if (constraint.type === "similarity") {
        return true;
    }

    // Only "eq" and "neq" are permissible for multiple search values
    if (constraint.filter.searchValues.length > 1 &&
        !(constraint.filter.function === "eq" || constraint.filter.function === "neq")) {
        return false;
    }

    return true;
}
