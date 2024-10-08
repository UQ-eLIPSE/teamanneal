import * as Record from "../../../common/Record";
import * as Constraint from "../../../common/Constraint";
import { ValueMessageReturn } from "../../../common/ValueMessageReturn";

import * as ColumnInfo from "./ColumnInfo";
import { CountConstraint } from "./CountConstraint";
import { LimitConstraint } from "./LimitConstraint";
import { SimilarityNumericConstraint } from "./SimilarityNumericConstraint";
import { SimilarityStringConstraint } from "./SimilarityStringConstraint";

export function init(records: Record.RecordSet, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, constraintDef: Constraint.Desc) {
    const colIndex = constraintDef.filter.column;
    const columnInfo = columnInfos[colIndex];

    switch (constraintDef.type) {
        case "count": return new CountConstraint(records, columnInfo, constraintDef);
        case "limit": return new LimitConstraint(records, columnInfo, constraintDef);
        case "similarity": {
            // Check what the column type is
            switch (columnInfo.type) {
                case "number": return new SimilarityNumericConstraint(records, columnInfo, constraintDef);
                case "string": return new SimilarityStringConstraint(records, columnInfo, constraintDef);
                default: throw new Error("Unknown column type");
            }
        }
        default: throw new Error("Unknown constraint type");
    }
}

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

    if (!isStratumValid(constraint)) {
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

export function isStratumValid(constraint: Constraint.Desc) {
    const strataValue = constraint.stratum;

    // Strata value must be a string identifier
    if (typeof strataValue !== "string") {
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
        case "count":
        case "limit":
        case "similarity":
            return true;
        default: return false;
    }
}

export function isApplicabilityConditionsArray(constraint: Constraint.Desc) {
    return Array.isArray(constraint.applicability);
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
        default: return false;
    }
}

export function isFilterSearchValuesNonEmpty(constraint: Constraint.Desc) {
    // Ignore similarity type constraints
    if (constraint.type === "similarity") {
        return true;
    }

    return constraint.filter.values.length !== 0;
}

export function isFilterFunctionValidForSearchValues(constraint: Constraint.Desc) {
    // Ignore similarity type constraints
    if (constraint.type === "similarity") {
        return true;
    }

    // Only "eq" and "neq" are permissible for multiple search values
    if (constraint.filter.values.length > 1 &&
        !(constraint.filter.function === "eq" || constraint.filter.function === "neq")) {
        return false;
    }

    return true;
}
