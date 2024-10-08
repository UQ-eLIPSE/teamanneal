import * as Constraint from "../../../common/Constraint";
import * as Record from "../../../common/Record";

import * as ColumnInfo from "./ColumnInfo";

export abstract class AbstractConstraint {
    public constraintDef: Readonly<Constraint.Desc>;
    public columnInfo: Readonly<ColumnInfo.ColumnInfo>;

    /**
     * @param records All record data
     * @param columnInfo The column info object related to the column in the constraint
     * @param constraintDef The constraint definition
     */
    constructor(records: Record.RecordSet, columnInfo: ColumnInfo.ColumnInfo, constraintDef: Constraint.Desc) {
        this.constraintDef = constraintDef;
        this.columnInfo = columnInfo;

        this.init(records);
    }

    /** Calculates the cost of a set of records against this constraint */
    public calculateWeightedCost(recordPointers: Uint32Array) {
        // If not applicable, cost is 0
        if (!this.isApplicableTo(recordPointers)) {
            return 0;
        }

        return this.calculateUnweightedCost(recordPointers) * this.constraintDef.weight;
    }

    public static applicabilityCheck(applicabilityCondition: Constraint.ApplicabilityCondition, recordPointers: Uint32Array) {
        switch (applicabilityCondition.type) {
            case "group-size": {
                const groupSize = recordPointers.length;
                const referenceSize = applicabilityCondition.value;

                switch (applicabilityCondition.function) {
                    case "eq": return groupSize === referenceSize;
                    case "neq": return groupSize !== referenceSize;
                    case "lt": return groupSize < referenceSize;
                    case "lte": return groupSize <= referenceSize;
                    case "gt": return groupSize > referenceSize;
                    case "gte": return groupSize >= referenceSize;
                    default: throw new Error("Unknown applicability condition function");
                }

            }
            default: throw new Error("Unknown applicability condition type");
        }

    }

    public isApplicableTo(recordPointers: Uint32Array) {
        const applicabilityConditions = this.constraintDef.applicability;

        if (applicabilityConditions.length > 0) {
            // Constraint applies if only ALL applicability conditions are met,
            // so if any of them are inapplicable, we immediately return false.
            for (let i = 0; i < applicabilityConditions.length; ++i) {
                let applicabilityCondition = applicabilityConditions[i];

                const applicable = AbstractConstraint.applicabilityCheck(applicabilityCondition, recordPointers);

                // If any inapplicable, then the whole thing is inapplicable
                if (!applicable) {
                    return false;
                }
            }
        }

        return true;
    }

    protected abstract init(records: Record.RecordSet): void;

    public abstract calculateUnweightedCost(recordPointers: Uint32Array): number;
}
