import * as Record from "../../../common/Record";
import * as Constraint from "../../../common/Constraint";

import * as AnnealNode from "../data/AnnealNode";
import * as ColumnInfo from "../data/ColumnInfo";

import * as CostFunction from "../anneal/CostFunction";


export interface ProcessedConstraint {
    /** Original constraint descriptor object */
    constraint: Constraint.Desc,

    /** 
     * Function that is applied to a bunch of leaves to filter out nodes of
     * interest for this constraint
     */
    filterFunction: FilterFunction,

    /** Function that produces base cost value BEFORE being scaled by weight */
    costFunction: CostFunction,

    /**
     * Array of functions that determine applicability of the constraint to
     * the current node/records
     */
    applicabilityFunctions: ApplicabilityFunction[],
}

export type FilterFunction = (node: AnnealNode.AnnealNode, leaves: ReadonlyArray<AnnealNode.AnnealNode>) => ReadonlyArray<AnnealNode.AnnealNode>;
export type CostFunction = (node: AnnealNode.AnnealNode, filteredLeaves: ReadonlyArray<AnnealNode.AnnealNode>, columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>) => number;
export type ApplicabilityFunction = (node: AnnealNode.AnnealNode) => boolean;


export function init(constraint: Constraint.Desc): ProcessedConstraint {
    switch (constraint.type) {
        case "count": return processCountConstraint(constraint);
        case "limit": return processLimitConstraint(constraint);
        case "similarity": return processSimilarityConstraint(constraint);
    }

    throw new Error("Unrecognised constraint type");
}

function processCountConstraint(constraint: Constraint.Base & Constraint.Count) {
    const filterCompareFn = getComparisonCostFunction(constraint.filter.function);
    const compareCostFn = getComparisonCostFunction(constraint.condition.function);
    const applicabilityFunctions = mapApplicabilityConditions(constraint.applicability);

    // TODO: Implement multiple value support
    const filterValue = constraint.filter.values[0];
    const filterColumnIndex = constraint.filter.column;

    // Target count value (e.g. filtered node count is greater than *value*)
    const targetCountValue = constraint.condition.value;

    const filterFunction = generateNodeCompareFilterFunction(filterCompareFn, filterValue, filterColumnIndex);

    const costFunction: CostFunction = (_node, filteredLeaves) => {
        return compareCostFn(targetCountValue, filteredLeaves.length);
    };

    const processedConstraint: ProcessedConstraint = {
        constraint,
        filterFunction,
        costFunction,
        applicabilityFunctions,
    }

    return processedConstraint;
}

function processLimitConstraint(constraint: Constraint.Base & Constraint.Limit) {
    const filterCompareFn = getComparisonCostFunction(constraint.filter.function);
    const limitCostFn = getLimitCostFunction(constraint.condition.function);
    const applicabilityFunctions = mapApplicabilityConditions(constraint.applicability);

    // TODO: Implement multiple value support
    const filterValue = constraint.filter.values[0];
    const filterColumnIndex = constraint.filter.column;

    const filterFunction = generateNodeCompareFilterFunction(filterCompareFn, filterValue, filterColumnIndex);

    const costFunction: CostFunction = (node, filteredLeaves) => {
        return Math.pow(limitCostFn(node.childrenSize, filteredLeaves.length), 1.5);
    };

    const processedConstraint: ProcessedConstraint = {
        constraint,
        filterFunction,
        costFunction,
        applicabilityFunctions,
    }

    return processedConstraint;
}

function processSimilarityConstraint(constraint: Constraint.Base & Constraint.Similarity) {
    const applicabilityFunctions = mapApplicabilityConditions(constraint.applicability);

    const filterColumnIndex = constraint.filter.column;

    const filterFunction = generateNodeDescendantOnlyFilterFunction();

    const costFunction: CostFunction = (_node, filteredLeaves, columnInfos) => {
        const columnInfo = columnInfos[filterColumnIndex];
        const values = filteredLeaves.map(leaf => (leaf.data as Record.Record)[filterColumnIndex]);

        // Cost is 0 if there are no records to process
        if (values.length === 0) {
            return 0;
        }

        switch (columnInfo.type) {
            case "number": {
                const similarityCostFn = getNumberSimilarityCostFunction(constraint.condition.function);

                // Get the number range from the entire column
                const range = columnInfo.range;

                // Only get numeric values in the column to calculate the
                // standard deviation on
                const numericValues: number[] = values.filter(value => typeof value === "number") as any[];

                return similarityCostFn(range, numericValues);
            }
            case "string": {
                const similarityCostFn = getStringSimilarityCostFunction(constraint.condition.function);

                // Maximum distinct values we can have should be capped at the
                // number of descendant leaves possible under this node
                //
                // Note that `filteredLeaves` should be the full set of
                // descendants - see `filterFunction` above.
                const maxDistinctValues = Math.min(values.length, columnInfo.distinct);

                // Create set; determine size = number of distinct values
                const set = new Set<Record.RecordElement>();
                values.forEach(value => set.add(value));

                const distinctRecordValues = set.size;

                return similarityCostFn(maxDistinctValues, distinctRecordValues);
            }
        }

        throw new Error("Unrecognised column type");
    };

    const processedConstraint: ProcessedConstraint = {
        constraint,
        filterFunction,
        costFunction,
        applicabilityFunctions,
    }

    return processedConstraint;
}

function generateNodeCompareFilterFunction(filterCompareFn: CostFunction.BooleanCost, filterValue: Record.RecordElement, filterColumnIndex: number) {
    const filterFunction: FilterFunction = (node, leaves) => {
        const filteredLeaves: AnnealNode.AnnealNode[] = [];

        for (let i = 0; i < leaves.length; ++i) {
            const leaf = leaves[i];

            // Ignore non-descendants
            if (!AnnealNode.isDescendantOf(node, leaf)) {
                continue;
            }

            // If filter condition met, add to array of filtered leaves
            // Note that the boolean test `filterCompareFn` returns 0 for
            // condition met
            if (filterCompareFn(filterValue, (leaf.data as Record.Record)[filterColumnIndex]) === 0) {
                filteredLeaves.push(leaf);
            }
        }

        return filteredLeaves;
    }

    return filterFunction;
}

function generateNodeDescendantOnlyFilterFunction() {
    const filterFunction: FilterFunction = (node, leaves) => {
        const filteredLeaves: AnnealNode.AnnealNode[] = [];

        for (let i = 0; i < leaves.length; ++i) {
            const leaf = leaves[i];

            // Push all descendant leaves through to `filteredLeaves`
            if (AnnealNode.isDescendantOf(node, leaf)) {
                filteredLeaves.push(leaf);
            }
        }

        return filteredLeaves;
    }

    return filterFunction;
}

function getComparisonCostFunction(functionValue: Constraint.ComparisonFunction) {
    switch (functionValue) {
        case "eq": return CostFunction.eq;
        case "neq": return CostFunction.neq;
        case "lt": return CostFunction.lt;
        case "lte": return CostFunction.lte;
        case "gt": return CostFunction.gt;
        case "gte": return CostFunction.gte;
    }

    throw new Error("Unrecognised function value");
}

function getLimitCostFunction(functionValue: Constraint.LimitFunction) {
    switch (functionValue) {
        case "low": return CostFunction.low;
        case "high": return CostFunction.high;
    }

    throw new Error("Unrecognised function value");
}

function getNumberSimilarityCostFunction(functionValue: Constraint.SimilarityFunction) {
    switch (functionValue) {
        case "similar": return CostFunction.numberSimilar;
        case "different": return CostFunction.numberDifferent;
    }

    throw new Error("Unrecognised function value");
}

function getStringSimilarityCostFunction(functionValue: Constraint.SimilarityFunction) {
    switch (functionValue) {
        case "similar": return CostFunction.stringSimilar;
        case "different": return CostFunction.stringDifferent;
    }

    throw new Error("Unrecognised function value");
}

function mapApplicabilityConditions(applicabilityConditions: ReadonlyArray<Constraint.ApplicabilityCondition>) {
    return applicabilityConditions.map(
        (condition) => {
            switch (condition.type) {
                case "group-size": return generateGroupSizeApplicabilityFunction(condition);
            }

            throw new Error("Unrecognised applicability condition type");
        }
    );
}

function generateGroupSizeApplicabilityFunction(condition: Constraint.ApplicabilityGroupSizeCondition) {
    const sizeCompareCostFn = getComparisonCostFunction(condition.function);
    const targetValue = condition.value;

    const applicabilityFunction: ApplicabilityFunction = (node) => {
        // When cost = 0 the applicability condition is met
        //
        // TODO: This should be changed to not implicitly calculate boolean
        // outcome from cost values
        return sizeCompareCostFn(targetValue, node.childrenSize) === 0;
    }

    return applicabilityFunction;
}
