import * as Constraint from "../../../common/Constraint";
import * as Record from "../../../common/Record";

import * as ColumnInfo from "../data/ColumnInfo";

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
    public calculateWeightedCost(recordPointers: Set<number>) {
        // If not applicable, cost is 0
        if (!this.isApplicableTo(recordPointers)) {
            return 0;
        }

        return this.calculateUnweightedCost(recordPointers) * this.constraintDef.weight;
    }

    public isApplicableTo(recordPointers: Set<number>) {
        const applicabilityConditions = this.constraintDef.applicability;

        if (applicabilityConditions.length > 0) {
            // Constraint applies if only ALL applicability conditions are met
            const applicability = applicabilityConditions.every((applicabilityCondition) => {
                switch (applicabilityCondition.type) {
                    case "group-size": {
                        const groupSize = recordPointers.size;
                        const referenceSize = applicabilityCondition.value;

                        switch (applicabilityCondition.function) {
                            case "eq": return groupSize === referenceSize;
                            case "neq": return groupSize !== referenceSize;
                            case "lt": return groupSize < referenceSize;
                            case "lte": return groupSize <= referenceSize;
                            case "gt": return groupSize > referenceSize;
                            case "gte": return groupSize >= referenceSize;
                        }

                        throw new Error("Unknown applicability condition function");
                    }
                }

                throw new Error("Unknown applicability condition type");
            });

            if (!applicability) {
                return false;
            }
        }

        return true;
    }

    protected abstract init(records: Record.RecordSet): void;

    public abstract calculateUnweightedCost(recordPointers: Set<number>): number;
}
