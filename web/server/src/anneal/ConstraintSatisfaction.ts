import * as Constraint from "../../../common/Constraint";
import * as Record from "../../../common/Record";

import * as AnnealNode from "../data/AnnealNode";
import * as ColumnInfo from "../data/ColumnInfo";

import * as ProcessedConstraint from "../anneal/ProcessedConstraint";

import * as Util from "../core/Util";



export function calculateSatisfaction(columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, processedConstraint: ProcessedConstraint.ProcessedConstraint, node: AnnealNode.AnnealNode, allLeaves: ReadonlyArray<AnnealNode.AnnealNode>) {
    // Run applicability check (only if there are such conditions)
    const applicabilityFunctions = processedConstraint.applicabilityFunctions;

    if (applicabilityFunctions.length > 0) {
        // Constraint applies if only ALL applicability conditions are
        // met
        const applicability = applicabilityFunctions.every(applicabilityFn => applicabilityFn(node));

        // If not applicable, we return "undefined" to indicate no test was
        // performed
        if (!applicability) {
            return undefined;
        }
    }

    // Get leaves under this node
    const leavesUnderNode = allLeaves.filter(leaf => AnnealNode.isDescendantOf(node, leaf));

    switch (processedConstraint.constraint.type) {
        case "count": return Count.calculateSatisfaction(columnInfos, processedConstraint, node, leavesUnderNode);
        case "limit": return Limit.calculateSatisfaction(columnInfos, processedConstraint, node, leavesUnderNode);
        case "similarity": return Similarity.calculateSatisfaction(columnInfos, processedConstraint, node, leavesUnderNode);
    }

    throw new Error("Unrecognised constraint type");
}


export namespace Count {
    export function calculateSatisfaction(columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, processedConstraint: ProcessedConstraint.ProcessedConstraint, node: AnnealNode.AnnealNode, leavesUnderNode: ReadonlyArray<AnnealNode.AnnealNode>) {
        // Run filter on group leaves under node
        const filteredLeaves = processedConstraint.filterFunction(node, leavesUnderNode);

        // Calculate cost
        const cost = processedConstraint.costFunction(node, filteredLeaves, columnInfos);

        // Satisfaction is exact - if the constraint is met, cost is 0, and we
        // return 1 for the satisfaction value
        if (cost === 0) {
            return 1;
        } else {
            return 0;
        }
    }
}

export namespace Limit {
    export function calculateSatisfaction(_columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, processedConstraint: ProcessedConstraint.ProcessedConstraint, node: AnnealNode.AnnealNode, leavesUnderNode: ReadonlyArray<AnnealNode.AnnealNode>) {
        // If there are no elements in group, then we say it has met constraint
        if (leavesUnderNode.length === 0) {
            return 1;
        }

        // Calculate proportion of the group leaves is covered by filtered
        // leaves
        const filteredLeaves = processedConstraint.filterFunction(node, leavesUnderNode);

        const filteredLeavesProportion = filteredLeaves.length / leavesUnderNode.length;


        // Use original constraint to determine what to do
        const constraint = processedConstraint.constraint as (Constraint.Base & Constraint.Limit);

        switch (constraint.condition.function) {
            case "low": {
                // Satisfaction is negatively proportional (lower proportion =
                // higher satisfaction)
                return 1 - filteredLeavesProportion;
            }

            case "high": {
                // Satisfaction is proportional
                return filteredLeavesProportion;
            }
        }

        throw new Error("Unrecognised constraint condition function");
    }
}

export namespace Similarity {
    export function calculateSatisfaction(columnInfos: ReadonlyArray<ColumnInfo.ColumnInfo>, processedConstraint: ProcessedConstraint.ProcessedConstraint, node: AnnealNode.AnnealNode, leavesUnderNode: ReadonlyArray<AnnealNode.AnnealNode>) {
        // Run filter on group leaves under node
        const filteredLeaves = processedConstraint.filterFunction(node, leavesUnderNode);

        // Use original constraint and column info to determine what to do
        const constraint = processedConstraint.constraint as (Constraint.Base & Constraint.Similarity);
        const columnIndex = constraint.filter.column;
        const columnInfo = columnInfos[columnIndex];

        switch (constraint.condition.function) {
            case "similar": {
                switch (columnInfo.type) {
                    case "string": {
                        // Calculate cost
                        const cost = processedConstraint.costFunction(node, filteredLeaves, columnInfos);

                        // Satisfaction is exact
                        // If ALL strings are equal in group, then we say
                        // constraint is met, otherwise it isn't
                        if (cost === 0) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }

                    case "number": {
                        // Use standard deviation of filtered leaves and compare
                        // to the wider column range
                        const values = filteredLeaves.map(leaf => (leaf.data as Record.Record)[columnIndex]);
                        const numericValues: number[] = values.filter(value => typeof value === "number") as any[];

                        const stdDev = Util.stdDev(numericValues);

                        const columnRange = columnInfo.range;

                        // Satisfaction is based on whether the standard
                        // deviation is under 10% of the general column range.
                        // Returned satisfaction is binary - if it falls outside
                        // the 10% range, it is considered "not met".
                        if (stdDev / columnRange < 0.1) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }

                }

                throw new Error("Unrecognised constraint condition function");
            }

            case "different": {
                switch (columnInfo.type) {
                    case "string": {
                        // Calculate cost
                        const cost = processedConstraint.costFunction(node, filteredLeaves, columnInfos);

                        // Satisfaction is exact
                        // If ALL strings are different in group, then we say
                        // constraint is met, otherwise it isn't
                        if (cost === 0) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }

                    case "number": {
                        // Use standard deviation of filtered leaves and compare
                        // to the wider column range
                        const values = filteredLeaves.map(leaf => (leaf.data as Record.Record)[columnIndex]);
                        const numericValues: number[] = values.filter(value => typeof value === "number") as any[];

                        const stdDev = Util.stdDev(numericValues);

                        const columnRange = columnInfo.range;

                        // Satisfaction is based on whether the standard
                        // deviation is over 25% of the general column range.
                        // Returned satisfaction is binary - if it falls outside
                        // the 25% range, it is considered "not met".
                        if (stdDev / columnRange > 0.25) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }

                }

                throw new Error("Unrecognised constraint condition function");
            }
        }

        throw new Error("Unrecognised constraint condition function");
    }
}
