import * as Stratum from "../../../common/Stratum";
import * as RecordData from "../../../common/RecordData";
import * as Constraint from "../../../common/Constraint";
import * as AnnealNode from "../../../common/AnnealNode";
import { NodeSatisfactionObject, SatisfactionMap, MultipleNodeSatisfactionStatistics } from "../../../common/ConstraintSatisfaction";

import { AbstractConstraint } from "../data/AbstractConstraint";
import { CountConstraint } from "../data/CountConstraint";
import { LimitConstraint } from "../data/LimitConstraint";
import { SimilarityNumericConstraint } from "../data/SimilarityNumericConstraint";
import { SimilarityStringConstraint } from "../data/SimilarityStringConstraint";

import { AnnealStratum } from "../data/AnnealStratum";
import { AnnealStratumNode } from "../data/AnnealStratumNode";

import * as Util from "../core/Util";
import { setupAnnealVariables } from "./Anneal";

/**
 * Calculates satisfaction value for a given node, only for constraints that
 * consider single nodes for satisfaction (`count` and `similarity` constraints.)
 * 
 * @param constraint A "single node satisfaction calculation" constraint
 * @param node The stratum node being checked (not root node)
 */
export function calculateValueSingleNodeSatisfactionCalculation(constraint: AbstractConstraint, node: AnnealStratumNode) {
    const recordPointers = node.getRecordPointers();

    // If not applicable, return undefined
    if (!constraint.isApplicableTo(recordPointers)) {
        return undefined;
    }

    switch (constraint.constraintDef.type) {
        case "count": return Count.calculateSatisfaction(constraint as CountConstraint, recordPointers);
        case "limit": throw new Error("Limit constraints are not 'single node satisfaction calculation' constraints");
        case "similarity": return Similarity.calculateSatisfaction(constraint as SimilarityNumericConstraint | SimilarityStringConstraint, recordPointers);
        default: throw new Error("Unrecognised constraint type");
    }
}

/**
 * Calculates satisfaction value for a given node, only for constraints that
 * consider multiple nodes for satisfaction (`limit` constraints.)
 * 
 * @param constraint A "multiple node satisfaction calculation" constraint
 * @param nodes The stratum nodes being checked (not root node)
 */
export function calculateValueMultipleNodeSatisfactionCalculation(constraint: AbstractConstraint, nodes: ReadonlyArray<AnnealStratumNode>) {
    // Filter nodes which aren't applicable to this constraint
    const applicableNodes = nodes.filter(node => constraint.isApplicableTo(node.getRecordPointers()));

    // If no nodes are left, we can't really generate a meaningful result

    if (applicableNodes.length === 0) {
        // If constraint is not applicable to any nodes in the stratum
        return {
            nodeToSatisfactionMapForConstraint: undefined,
            statistics: undefined
        };
    }

    switch (constraint.constraintDef.type) {
        case "count":
        case "similarity":
            throw new Error("Count and similarity constraints are not 'multiple node satisfaction calculation' constraints");
        case "limit":
            return Limit.calculateSatisfaction(constraint as LimitConstraint, applicableNodes);
        default: throw new Error("Unrecognised constraint type");        
    }
}

/**
 * Gets only constraints applicable to given stratum.
 * 
 * @param constraints 
 * @param stratum 
 */
export function getStratumConstraints(constraints: ReadonlyArray<AbstractConstraint>, stratum: AnnealStratum) {
    return constraints.filter(c => c.constraintDef.stratum === stratum.id);
}

/**
 * Generates a satisfaction map object for one stratum.
 */
export function generateSingleStratumMap(constraints: ReadonlyArray<AbstractConstraint>, stratum: AnnealStratum) {
    // We only work with constraints that actually apply to this stratum
    const stratumConstraints = getStratumConstraints(constraints, stratum);

    // Split constraints into two "satisfaction calculation" types
    const {
        singleNode: singleNodeSatConstraints,
        multipleNode: multipleNodeSatConstraints,
    } = binConstraintsBySatisfactionCalculationType(stratumConstraints);

    const stratumStatistics: { [constraintId: string]: MultipleNodeSatisfactionStatistics } = {};

    // Collect up all node satisfaction objects into one large lookup map

    // First pass: all "single node satisfaction calculation" constraints
    const satisfactionMap =
        stratum.nodes.reduce<SatisfactionMap>((satisfactionMap, node) => {
            const nodeId = node.getId();

            // Collect up all constraint satisfaction for this node in an object
            satisfactionMap[nodeId] = singleNodeSatConstraints.reduce<NodeSatisfactionObject>((nodeSatisfactionObject, constraint) => {
                nodeSatisfactionObject[constraint.constraintDef._id] = calculateValueSingleNodeSatisfactionCalculation(constraint, node);
                return nodeSatisfactionObject;
            }, {});

            return satisfactionMap;
        }, {});

    // Second pass: all "multiple node satisfaction calculation" constraints
    for (let constraint of multipleNodeSatConstraints) {
        // For every "multiple node constraint"
        // Calculate satisfaction value for applicable stratum
        const { nodeToSatisfactionMapForConstraint, statistics } = calculateValueMultipleNodeSatisfactionCalculation(constraint, stratum.nodes);


        if (nodeToSatisfactionMapForConstraint !== undefined && nodeToSatisfactionMapForConstraint !== null) {
            // For every node in current stratum
            Object.keys(nodeToSatisfactionMapForConstraint).forEach((nodeId: string) => {

                // Add constraint's satisfaction value (for that node) to the satisfaction map
                if (satisfactionMap[nodeId] === undefined) satisfactionMap[nodeId] = {};
                satisfactionMap[nodeId][constraint.constraintDef._id] = nodeToSatisfactionMapForConstraint[nodeId];
            });
        }

        if (statistics !== undefined && statistics !== null) {
            // Store limit constraint statistics per constraint
            stratumStatistics[constraint.constraintDef._id] = statistics;
        }
    }

    return { satisfactionMap: satisfactionMap, stratumStatistics: stratumStatistics };

}

/**
 * Separates constraints into two arrays:
 * 
 * * "single node satisfaction calculation" - constraints which calculate
 *   satisfaction on an individual node basis (`count`, `similarity`)
 * 
 * * "multiple node satisfaction calculation" - constraints which calculate
 *   satisfaction with consideration to a set of multiple nodes (`limit`)
 * 
 * @param constraints Array of constraints
 */
export function binConstraintsBySatisfactionCalculationType(constraints: ReadonlyArray<AbstractConstraint>) {
    const singleNode: AbstractConstraint[] = [];
    const multipleNode: AbstractConstraint[] = [];

    for (let constraint of constraints) {
        const multiplicity: "singleNode" | "multipleNode" = binConstraintBySatisfactionCalculationType(constraint);

        switch (multiplicity) {
            case "singleNode": {
                singleNode.push(constraint);
                break;
            }
            case "multipleNode": {
                multipleNode.push(constraint);
                break;
            }
        }
    }

    return {
        singleNode,
        multipleNode,
    };
}

export function binConstraintBySatisfactionCalculationType(constraint: AbstractConstraint) {
    switch (constraint.constraintDef.type) {
        case "count":
        case "similarity": {
            return "singleNode";
        }
        case "limit": {
            return "multipleNode";
        }
    }
}

/**
 * Generates a satisfaction map object that covers all given strata.
 */
export function generateMap(constraints: ReadonlyArray<AbstractConstraint>, strata: ReadonlyArray<AnnealStratum>) {

    // Generate satisfaction data for every stratum
    const strataSatisfaction = strata.map(stratum => generateSingleStratumMap(constraints, stratum));

    // Combine all satisfaction maps (per stratum) into a single map
    const satisfactionMap = strataSatisfaction.map(sat => sat.satisfactionMap)
        .reduce((carry, stratumSatisfactionMap) => Object.assign(carry, stratumSatisfactionMap), {});

    // Generate satisfaction statistics map
    // Combine all satisfaction statistics (per stratum) into one map 
    const statisticsMap = strataSatisfaction.map(sat => sat.stratumStatistics)
        .reduce((carry, stratumSatisfactionMap) => Object.assign(carry, stratumSatisfactionMap), {});

    return { satisfactionMap: satisfactionMap, statistics: statisticsMap };
}

/**
 * Calculates satisfaction map from data equivalent to an anneal request.
 * 
 * @param annealRootNode 
 * @param recordData 
 * @param strataDefinitions 
 * @param constraintDefinitions 
 */
export function generateSatisfactionMapFromAnnealRequest(annealRootNode: AnnealNode.NodeRoot, recordData: RecordData.Desc, strataDefinitions: ReadonlyArray<Stratum.Desc>, constraintDefinitions: ReadonlyArray<Constraint.Desc>) {
    const {
        constraints,
        strata,
    } = setupAnnealVariables(annealRootNode, recordData, strataDefinitions, constraintDefinitions);

    /// ===============
    /// Generate output
    /// ===============

    return generateMap(constraints, strata);
}

/**
 * Calculates the satisfaction value for one stratum.
 * 
 * @param constraints 
 * @param stratum 
 */
export function calculateStratumSatisfactionValue(constraints: ReadonlyArray<AbstractConstraint>, stratum: AnnealStratum) {
    // We only work with constraints that actually apply to this stratum
    const stratumConstraints = getStratumConstraints(constraints, stratum);
    const stratumNodes = stratum.nodes;
    let maxSatisfaction = 0;
    let stratumSatisfaction = 0;

    const {
        singleNode: singleNodeSatConstraints,
        multipleNode: multipleNodeSatConstraints,
    } = binConstraintsBySatisfactionCalculationType(stratumConstraints);

    stratumSatisfaction += singleNodeSatConstraints.reduce((totalSum, constraint) => {
        const constraintSatisfactionValue = stratumNodes.reduce((stratumSatisfactionSum, node) => {
            const value = calculateValueSingleNodeSatisfactionCalculation(constraint, node);
            if (value !== undefined) {
                // If a value is defined for this constraint's satisfaction,
                // increment maximum possible satisfaction
                ++maxSatisfaction;
                return stratumSatisfactionSum + value;
            } else return stratumSatisfactionSum;

        }, 0);

        return totalSum + constraintSatisfactionValue;
    }, 0);


    stratumSatisfaction += multipleNodeSatConstraints.reduce((totalSum, constraint) => {
        const { nodeToSatisfactionMapForConstraint } = calculateValueMultipleNodeSatisfactionCalculation(constraint, stratum.nodes);
        return totalSum + stratum.nodes.reduce((sum, node) => {
            if (nodeToSatisfactionMapForConstraint === undefined) return sum;
            const satisfaction = nodeToSatisfactionMapForConstraint[(node.getId())];
            if (satisfaction === undefined) {
                return sum;
            } else {
                // If a value is defined for this constraint's satisfaction,
                // increment maximum possible satisfaction
                ++maxSatisfaction;
                return sum + satisfaction;
            }
        }, 0)

    }, 0);

    return {
        /** Given stratum's satisfaction value */
        value: stratumSatisfaction,
        /** Maximum possible satisfaction value for this stratum */
        max: maxSatisfaction,
    };
}



/**
 * Calculates the satisfaction value for one stratum.
 * @deprecated Function not used. Retained for reference.
 * @param constraints 
 * @param stratum 
 */
export function calculateStratumSatisfactionValue2(constraints: ReadonlyArray<AbstractConstraint>, stratum: AnnealStratum) {
    // We only work with constraints that actually apply to this stratum
    const stratumConstraints = getStratumConstraints(constraints, stratum);
    const stratumNodes = stratum.nodes;

    // We calculate the total max possible satisfaction points, so that clients
    // are aware of what they should be expecting as a max
    //
    // This is necessary because some constraints depend on the size of the node
    // and thus may switch on/off in some satisfaction checks during operations
    // like a move, which may affect how their "satisfaction" is perceived
    let maxSatisfaction = stratumConstraints.length * stratumNodes.length;

    const stratumSatisfactionValue = stratumNodes.reduce((stratumSatisfaction, node) => {
        // Run through all constraints and calculate satisfaction
        const nodeSatisfactionValue = stratumConstraints.reduce((nodeSatisfaction, constraint) => {
            // Calculate the satisfaction value for (constraint, node) pair
            const value = calculateValueSingleNodeSatisfactionCalculation(constraint, node);

            // If satisfaction is `undefined`, reduce the max satisfaction by 1
            // because the constraint is not applicable to the given node which
            // affects the total possible satisfaction score
            if (value === undefined) {
                --maxSatisfaction;
                return nodeSatisfaction;
            } else {
                return nodeSatisfaction + value;
            }
        }, 0);

        return stratumSatisfaction + nodeSatisfactionValue;
    }, 0);

    return {
        /** Given stratum's satisfaction value */
        value: stratumSatisfactionValue,
        /** Maximum possible satisfaction value for this stratum */
        max: maxSatisfaction,
    };
}

/**
 * Calculates the total satisfaction value for all given strata.
 * 
 * @param constraints 
 * @param strata 
 */
export function calculateTotalSatisfactionValue(constraints: ReadonlyArray<AbstractConstraint>, strata: ReadonlyArray<AnnealStratum>) {
    return strata
        .map(stratum => calculateStratumSatisfactionValue(constraints, stratum))
        .reduce((carry, stratumSatisfaction) => {
            carry.value += stratumSatisfaction.value;
            carry.max += stratumSatisfaction.max;
            return carry;
        });
}

/**
 * Calculates total satisfaction value from data equivalent to an anneal request.
 * 
 * @param annealRootNode 
 * @param recordData 
 * @param strataDefinitions 
 * @param constraintDefinitions 
 */
export function calculateTotalSatisfactionFromAnnealRequest(annealRootNode: AnnealNode.NodeRoot, recordData: RecordData.Desc, strataDefinitions: ReadonlyArray<Stratum.Desc>, constraintDefinitions: ReadonlyArray<Constraint.Desc>) {
    const {
        constraints,
        strata,
    } = setupAnnealVariables(annealRootNode, recordData, strataDefinitions, constraintDefinitions);

    return calculateTotalSatisfactionValue(constraints, strata);
}

export namespace Count {
    export function calculateSatisfaction(constraint: CountConstraint, recordPointers: Uint32Array) {
        // Calculate cost
        const cost = constraint.calculateUnweightedCost(recordPointers);

        // Satisfaction is exact - if the constraint is met, cost is 0, and we
        // return 1 for the satisfaction value
        if (cost === 0) {
            return 1;   // 100% satisfied
        } else {
            return 0;   // 0% satisfied
        }
    }
}

export namespace Limit {
    /**
     * Generates expected "pigeonhole" distribution for a given number of nodes.
     * 
     * @param numberOfNodes Number of nodes (stratum nodes, not leaves)
     * @param numberToDistribute Number of leaves to distribute across the nodes
     * 
     * @returns An object where the key is the number of satisfying leaves in a
     *          node, value is the number of such nodes expected
     *          
     *          For example:
     *          ```
     *          {
     *            3: 5,     // 5 nodes with 3 satisfying leaves
     *            4: 3      // 3 nodes with 4 satisfying leaves
     *          }           // = 8 total nodes
     *          ```
     */
    function generateExpectedDistribution(numberOfNodes: number, numberToDistribute: number): { [satisfyingCountInNode: number]: number } {
        // Prevent divisions by 0 by returning early
        if (numberOfNodes === 0) {
            return { 0: 0 };
        }

        // Integer division with floor to get the minimum per node
        const minNumLeavesPerNode = (numberToDistribute / numberOfNodes) >>> 0;

        // If division fits nicely, return that as the distribution
        if (numberToDistribute % numberOfNodes === 0) {
            return { [minNumLeavesPerNode]: numberOfNodes };
        }

        // Calculate the expected distribution
        //
        // Where:
        //  l = minNumLeavesPerNode,
        //  n = numberOfNodes,
        //  d = numberToDistribute;
        //
        // Output is:
        //
        // {
        //    [l]: x
        //    [l+1]: y
        // }
        //
        // Algebra:
        // x -> num nodes w/ min leaves, y = num nodes w/ max leaves
        //         x + y = n
        //         n/l = d          - (1)
        //   lx + (l+1)y = d
        //
        //             y = (n - x)
        //             From (1):
        //    (l+1)n - x = d
        //             x = (l+1)n - d

        const x = ((minNumLeavesPerNode + 1) * numberOfNodes) - numberToDistribute;

        return {
            [minNumLeavesPerNode]: x,
            [minNumLeavesPerNode + 1]: (numberOfNodes - x),
        };
    }

    function generateMinMaxFromDistribution(distribution: { [satisfyingRecordCount: string]: number }) {
        // The distribution describes [satisfyingRecordCount]: Number of nodes which have that record count
        const sortedDistribution = Object.keys(distribution)
            .map((satisfyingRecordCountString: string) => parseInt(satisfyingRecordCountString))
            // Sort distribution
            .sort((a, b) => a - b);

        // Return minimum and maximum record count extracted from the distribution
        return { minSatisfyingRecordCount: sortedDistribution[0], maxSatisfyingRecordCount: sortedDistribution[sortedDistribution.length - 1] }

    }

    export function calculateSatisfaction(constraint: LimitConstraint, nodes: ReadonlyArray<AnnealStratumNode>) {
        // We count the satisfying record count below = number to distribute
        /** Qualifying record count based on constraint */
        let numberToDistribute: number = 0;

        // Go through nodes and get the actual distribution and also accumulate
        // the total number of leaves/records to distribute
        const actualDistribution: { [satisfyingCountInNode: number]: number } = {};

        /** Maps node id to number of satisfying records contained by the node */
        const nodeToSatisfyingRecordCountMap: { [key: string]: number } = {};

        /** Total number of nodes */
        const numberOfNodes = nodes.length;

        /** Maps node id to node satisfaction */
        const nodeIdSatisfactionMap: { [key: string]: number | undefined } = {};

        // Iterate through nodes
        for (let node of nodes) {

            // Get all records under that node
            const nodeRecordPointers = node.getRecordPointers();
            const satisfyingRecordCount = constraint.countFilterSatisfyingRecords(nodeRecordPointers);

            // Stores the number of satisfying records for this node in a map
            nodeToSatisfyingRecordCountMap[node.getId()] = satisfyingRecordCount;
            // Increment number of nodes at that satisfying record count key
            actualDistribution[satisfyingRecordCount] = (actualDistribution[satisfyingRecordCount] || 0) + 1;

            // Accumulate number to distribute
            numberToDistribute += satisfyingRecordCount;
        }

        // Calculate the expected distribution of this stratum based on total number of nodes in the
        // stratum and the number of records to distribute among them
        const expectedDistribution = generateExpectedDistribution(numberOfNodes, numberToDistribute);

        // Find minimum and maximum qualifying record count values
        const { minSatisfyingRecordCount, maxSatisfyingRecordCount } = generateMinMaxFromDistribution(expectedDistribution);

        // Fail any nodes which have satisfying record count outside the (min, max) range
        // Generate a one-to-one mapping between nodes and limit constraint satisfaction values
        for (const nodeId in nodeToSatisfyingRecordCountMap) {
            const numSatisfyingRecords = nodeToSatisfyingRecordCountMap[nodeId];
            if (numSatisfyingRecords < minSatisfyingRecordCount || numSatisfyingRecords > maxSatisfyingRecordCount) {
                // record count of the node lies outside the distribution limits
                nodeIdSatisfactionMap[nodeId] = 0;
            } else {
                // Record count is within the (min, max) range
                nodeIdSatisfactionMap[nodeId] = 1;
            }
        }

        const statistics = {
            // Expected distribution among stratum nodes, based on constraint satisfaction of records
            expectedDistribution,
            // Actual distribution among stratum nodes
            actualDistribution
        };

        return { nodeToSatisfactionMapForConstraint: nodeIdSatisfactionMap, statistics: statistics };
    }
}

export namespace Similarity {
    function calculateNumericSatisfaction(constraint: SimilarityNumericConstraint, recordPointers: Uint32Array) {
        const columnInfo = constraint.columnInfo;
        const values = constraint.getValues(recordPointers);

        if (columnInfo.type !== "number") {
            throw new Error("Expected numeric column type");
        }

        // 100% satisfaction if there are no values or if there is only one
        // value (in which case we can't tell how "similar" they are)
        if (values.length <= 1) {
            return 1;
        }

        const columnRange = columnInfo.range;
        const stdDev = Util.stdDev(values);

        switch (constraint.constraintDef.condition.function) {
            case "similar": {
                // Satisfaction is based on whether the standard
                // deviation is under 10% of the general column range.
                // Returned satisfaction is binary - if it falls outside
                // the 10% range, it is considered "not met".
                if (stdDev / columnRange < 0.1) {
                    return 1;   // 100% satisfaction
                } else {
                    return 0;   // 0% satisfaction
                }
            }

            case "different": {
                // Satisfaction is based on whether the standard
                // deviation is over 25% of the general column range.
                // Returned satisfaction is binary - if it falls outside
                // the 25% range, it is considered "not met".
                if (stdDev / columnRange > 0.25) {
                    return 1;   // 100% satisfaction
                } else {
                    return 0;   // 0% satisfaction
                }
            }
        }

        throw new Error("Unknown condition function");
    }

    function calculateStringSatisfaction(constraint: SimilarityStringConstraint, recordPointers: Uint32Array) {
        switch (constraint.constraintDef.condition.function) {
            case "similar":
            case "different": {
                // Calculate cost
                const cost = constraint.calculateUnweightedCost(recordPointers);

                // Satisfaction is exact - it either meets the condition
                // or not (either fully same or fully different)
                if (cost === 0) {
                    return 1;   // 100% satisfied
                } else {
                    return 0;   // 0% satisfied
                }
            }
        }

        throw new Error("Unknown condition function");
    }

    export function calculateSatisfaction(constraint: SimilarityNumericConstraint | SimilarityStringConstraint, recordPointers: Uint32Array) {
        switch (constraint.columnInfo.type) {
            case "number": return calculateNumericSatisfaction(constraint as SimilarityNumericConstraint, recordPointers);
            case "string": return calculateStringSatisfaction(constraint as SimilarityStringConstraint, recordPointers);
            default: throw new Error("Unknown column type");
        }
    }
}
