import { Store, GetterTree } from "vuex";
import { AnnealCreatorState as State } from "./state";

import * as Partition from "../../data/Partition";
import * as StratumSize from "../../data/StratumSize";
import * as StratumNamingConfig from "../../data/StratumNamingConfig";
import * as AnnealRequestState from "../../data/AnnealRequestState";
import { Stratum } from "../../data/Stratum";
import { ColumnData } from "../../data/ColumnData";
import { Constraint } from "../../data/Constraint";
import { GroupNode } from "../../data/GroupNode";
import { GroupNodeRoot } from "../../data/GroupNodeRoot";
import { GroupNodeLeafStratum } from "../../data/GroupNodeLeafStratum";
import { GroupNodeIntermediateStratum } from "../../data/GroupNodeIntermediateStratum";
import * as StratumNamingConfigContext from "../../data/StratumNamingConfigContext";

import { reverse } from "../../util/Array";

type GetterFunction<G extends AnnealCreatorGetter> = typeof getters[G];

export enum AnnealCreatorGetter {
    HAS_SOURCE_FILE_DATA = "Has source file data",
    HAS_VALID_ID_COLUMN_INDEX = "Has a valid ID column index defined",
    HAS_DUPLICATE_COLUMN_NAMES = "Has duplicate column names",
    HAS_STRATA = "Has strata defined",
    HAS_CONSTRAINTS = "Has constraints defined",
    IS_STRATA_CONFIG_NAMES_VALID = "Is strata config names valid",
    IS_STRATA_CONFIG_SIZES_VALID = "Is strata config sizes valid",
    IS_ANNEAL_REQUEST_IN_PROGRESS = "Is anneal request in progress",
    VALID_ID_COLUMNS = "Valid ID columns",
    HAS_CONFIG = "Has config set",
    HAS_CONFIG_AND_SOURCE_FILE_DATA = "Has both config and source file data",
    HAS_VALID_PARTITION_COLUMN = "Has valid partition column",
    ARE_ALL_CONSTRAINTS_VALID = "Are all constraints valid",
    EXPECTED_PARTITIONS = "Expected partitions",
    EXPECTED_NODE_TREE = "Expected node tree",
    EXPECTED_NAME_LABELS_FOR_EACH_STRATUM = "Expected name labels for each stratum",
    POSSIBLE_GROUP_SIZES_FOR_EACH_STRATUM = "Possible group sizes for each stratum",
    IS_ANNEAL_ABLE_TO_BE_EXECUTED = "Is anneal able to be executed",
}

/** Shorthand for Getter enum above */
const G = AnnealCreatorGetter;

/** Type-safe getter function factory */
export function getFactory<T>(store: Store<T>, modulePrefix?: string) {
    const prefix = (modulePrefix !== undefined) ? `${modulePrefix}/` : "";

    return function get<G extends AnnealCreatorGetter, F extends GetterFunction<G>>(getter: G): ReturnType<F> {
        return store.getters[prefix + getter] as ReturnType<F>;
    }
}

/** Store getter functions */
const getters = {
    [G.HAS_SOURCE_FILE_DATA](state: State) {
        return state.recordData.source.length > 0;
    },

    [G.HAS_VALID_ID_COLUMN_INDEX](state: State) {
        return state.recordData.idColumn !== undefined;
    },

    [G.HAS_DUPLICATE_COLUMN_NAMES](state: State) {
        const columnNames = state.recordData.source.columns.map(column => column.label);
        const uniqueColumnNames = new Set(columnNames);
        return uniqueColumnNames.size !== columnNames.length;
    },

    [G.HAS_STRATA](state: State) {
        return state.strataConfig.strata.length > 0;
    },

    [G.HAS_CONSTRAINTS](state: State) {
        return state.constraintConfig.constraints.length > 0;
    },

    [G.IS_STRATA_CONFIG_NAMES_VALID](state: State) {
        const strata = state.strataConfig.strata;

        const strataNameSet = new Set<string>();

        for (let stratum of strata) {
            // We consider uniqueness regardless of case
            const label = stratum.label.trim().toLowerCase();

            // Do not permit blank string names
            if (label.length === 0) { return false; }

            // Do not permit "pool" as a name - it is reserved
            if (label === "pool") { return false; }

            strataNameSet.add(label);
        }

        // Do not permit non unique strata names
        if (strataNameSet.size !== strata.length) { return false; }

        // Otherwise we're good to go
        return true;
    },

    [G.IS_STRATA_CONFIG_SIZES_VALID](state: State) {
        const strata = state.strataConfig.strata;

        if (strata === undefined) { return false; }

        // Map out the size definitions for each stratum
        const strataSizes = strata.map(s => s.size);

        // All stratum sizes must be valid
        for (let size of strataSizes) {
            // Run validity checks
            if (
                // Values must be integers
                StratumSize.isSizeMinNotUint32(size) ||
                StratumSize.isSizeIdealNotUint32(size) ||
                StratumSize.isSizeMaxNotUint32(size) ||

                // Must be min <= ideal <= max
                StratumSize.isSizeMinGreaterThanIdeal(size) ||
                StratumSize.isSizeIdealGreaterThanMax(size) ||

                // Not permitted for min to equal max
                StratumSize.isSizeMinEqualToMax(size) ||

                // Minimum is always 1
                StratumSize.isSizeMinLessThanOne(size)
            ) {
                return false;
            }
        }

        // Check that group size calculations are possible over all partitions
        const columns = state.recordData.source.columns;
        const partitionColumnDescriptor = state.recordData.partitionColumn;

        try {
            const partitions = Partition.initManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);

            partitions.forEach((partition) => {
                // Attempt group sizes for each partition
                const numberOfRecordsInPartition = Partition.getNumberOfRecords(partition);
                return StratumSize.generateStrataGroupSizes(strataSizes, numberOfRecordsInPartition);
            });
        } catch (e) {
            // Group size calculations failed
            return false;
        }

        // Otherwise we're good to go
        return true;
    },

    [G.IS_ANNEAL_REQUEST_IN_PROGRESS](state: State) {
        return AnnealRequestState.isInProgress(state.annealRequest);
    },

    [G.VALID_ID_COLUMNS](state: State) {
        const recordData = state.recordData;
        const columns = recordData.source.columns;
        const recordDataRawLength = recordData.source.length;

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = recordDataRawLength - 1;

        // Filter only those with column values unique
        return columns
            .filter((column) => {
                const valueSet = ColumnData.GetValueSet(column);
                return valueSet.size === numberOfRecords;
            });
    },

    [G.HAS_CONFIG](_state: State, getters: any) {
        // Config is assumed to be loaded when there is strata defined
        // 
        // TODO: Fix with type-safe accessors
        return getters[G.HAS_STRATA] as boolean;
    },

    [G.HAS_CONFIG_AND_SOURCE_FILE_DATA](_state: State, getters: any) {
        // TODO: Fix with type-safe accessors
        return (
            (getters[G.HAS_CONFIG] as boolean)
            && (getters[G.HAS_SOURCE_FILE_DATA] as boolean)
        );
    },

    [G.HAS_VALID_PARTITION_COLUMN](state: State) {
        const recordData = state.recordData;
        const selectedPartitionColumn = recordData.partitionColumn;

        if (selectedPartitionColumn === undefined) {
            return true;
        }

        const columns = recordData.source.columns;

        // See if there is a column defined with the partition column's ID
        return columns.some(c => ColumnData.Equals(c, selectedPartitionColumn));
    },

    [G.ARE_ALL_CONSTRAINTS_VALID](state: State, getters: any) {
        const columns = state.recordData.source.columns;

        // TODO: Fix with type-safe accessors
        const groupSizes = getters[G.POSSIBLE_GROUP_SIZES_FOR_EACH_STRATUM] as Record<string, ReadonlyArray<number>>;

        return state.constraintConfig.constraints.every((constraint) => {
            const constraintStratumGroupSizes = groupSizes[constraint.stratum];

            return Constraint.IsValid(constraint, columns, constraintStratumGroupSizes);
        });
    },

    [G.EXPECTED_PARTITIONS](state: State) {
        const columns = state.recordData.source.columns;
        const partitionColumnDescriptor = state.recordData.partitionColumn;

        // Run group sizing in each partition, and merge the distributions at
        // the end
        try {
            const partitions = Partition.initManyFromPartitionColumnDescriptor(columns, partitionColumnDescriptor);
            return partitions;
        } catch {
            // If error occurs, return empty array
            return [];
        }
    },

    [G.EXPECTED_NODE_TREE](state: State, getters: any) {
        // Build up very basic node tree based on GroupNode

        // We don't care about the node IDs for this tree because this output is
        // only intended to represent the expected node tree shape, not actually
        // contain any data

        const strata = state.strataConfig.strata;
        const strataSizes = strata.map(s => s.size);

        // TODO: Fix with type-safe accessors
        const partitions = getters[G.EXPECTED_PARTITIONS] as ReadonlyArray<Partition.Partition>;

        try {
            const nodeTrees = partitions.map((partition) => {
                // Generate group sizes for each partition
                const numberOfRecordsInPartition = Partition.getNumberOfRecords(partition);

                // We flip it around in server order to make it easier to
                // iterate over
                const strataIndividualGroupSizesServerOrder = reverse(StratumSize.generateStrataGroupSizes(strataSizes, numberOfRecordsInPartition));

                // Generate leaf nodes first
                const leafNodes =
                    strataIndividualGroupSizesServerOrder[0].map(_ => {
                        const node: GroupNodeLeafStratum = {
                            _id: "",
                            type: "leaf-stratum",
                        };

                        return node;
                    });


                // Note we start from i = 1 because we have already dealt with leaf
                // nodes
                let prevNodes: (GroupNodeIntermediateStratum | GroupNodeLeafStratum)[] = leafNodes;

                for (let i = 1; i < strataIndividualGroupSizesServerOrder.length; ++i) {
                    const sizes = strataIndividualGroupSizesServerOrder[i];

                    prevNodes = sizes.map((numberOfChildren) => {
                        const intermediateNode: GroupNodeIntermediateStratum = {
                            _id: "",
                            type: "intermediate-stratum",
                            children: prevNodes.splice(0, numberOfChildren),
                        };

                        return intermediateNode;
                    });
                }

                // Cap it off with a root node for each partition
                const rootNode: GroupNodeRoot = {
                    _id: "",
                    type: "root",
                    children: prevNodes,
                };

                return rootNode;
            });

            return nodeTrees;
        } catch {
            return [];
        }
    },

    [G.EXPECTED_NAME_LABELS_FOR_EACH_STRATUM](state: State, getters: any) {
        const strataConfig = state.strataConfig;
        const strata = strataConfig.strata;

        // Build up information for each context
        const contexts = strata.reduce<Map<StratumNamingConfigContext.StratumNamingConfigContext, { stratum: Stratum, contextDepth: number, targetDepth: number }[]>>((map, stratum, i) => {
            const { context } = StratumNamingConfig.getStratumNamingConfig(strataConfig, stratum._id);

            let strataUnderContext = map.get(context);

            if (strataUnderContext === undefined) {
                map.set(context, strataUnderContext = []);
            }

            // `contextDepth` is the number of steps down from an imaginary
            // "global" root to reach the specific context stratum
            //
            // e.g. 
            // * GLOBAL = 0
            // * PARTITION = 1
            // * Stratum A (top-most) = 2
            // * Stratum B = 3
            // * Stratum C (bottom-most/leaf) = 4
            // 
            // `targetDepth` is the depth of the target stratum
            // 
            // e.g. If Stratum B uses a PARTITION context, `targetDepth` = 3

            let contextDepth: number;

            switch (context) {
                case StratumNamingConfigContext.Context.GLOBAL: {
                    contextDepth = 0;
                    break;
                }

                case StratumNamingConfigContext.Context.PARTITION: {
                    contextDepth = 1;
                    break;
                }

                default: {
                    // Find the stratum index in the strata array
                    contextDepth = strata.findIndex(s => s._id === context) + 2;
                    break;
                }
            }

            strataUnderContext.push({
                stratum,
                contextDepth,
                targetDepth: i + 2,
            });

            return map;
        }, new Map());

        // TODO: Fix with type-safe accessors
        const expectedNodeTrees = getters[G.EXPECTED_NODE_TREE] as ReadonlyArray<GroupNodeRoot>;

        // Reform partitions into nodes so we have a consistent way to read 
        // the tree
        const tree: GroupNodeRoot = {
            _id: "",
            type: "root",
            children: expectedNodeTrees.map((partitionRootNode) => {
                const node: GroupNodeIntermediateStratum = {
                    _id: "",
                    type: "intermediate-stratum",
                    children: partitionRootNode.children,
                };

                return node;
            }),
        };

        /**
         * Walker function that sums all target nodes under the given start node
         * 
         * @param node Starting "context" node
         * @param targetDepth The depth at which you count nodes for the sum
         * @param currentDepth The current depth you're at (should be the context node's depth)
         */
        function targetCountWalker(node: GroupNode, targetDepth: number, currentDepth: number): number {
            // We've hit a node with the correct depth, return 1 for
            // summation by parent
            if (currentDepth === targetDepth) {
                return 1;
            }

            // If we've now hit the end, we can't go further
            if (node.type === "leaf-stratum") {
                return 0;
            }

            // Recurse through children
            return node.children.reduce<number>((sum, child) => sum + targetCountWalker(child, targetDepth, currentDepth + 1), 0);
        }

        /**
         * Walker function that returns the maximum number of nodes at the
         * target depth under each node at the context depth
         * 
         * @param node Starting node (generally the "global" node)
         * @param contextDepth The depth at which the context nodes sit
         * @param targetDepth The depth at which you count nodes for the sum
         * @param currentDepth The current depth you're at (should start at 0 for the global node)
         */
        function contextTargetCountWalker(node: GroupNode, contextDepth: number, targetDepth: number, currentDepth: number): number {
            // Keep going down until you hit the depth for the context, at which
            // point you switch to the target counter
            if (currentDepth === contextDepth) {
                return targetCountWalker(node, targetDepth, currentDepth);
            }

            // If we've now hit the end, we can't go further
            if (node.type === "leaf-stratum") {
                return 0;
            }

            // Recurse through children
            //
            // Note that we only need to take the maximum from each context
            // node, NOT the sum, as each context should have a new separate set
            // of names, so it's not cumulative
            return node.children.reduce<number>((contextCount, child) => Math.max(contextCount, contextTargetCountWalker(child, contextDepth, targetDepth, currentDepth + 1)), 0);
        }

        // Run through all contexts and strata and count
        const nameLabelCounts: Record<string, number> = {};

        contexts.forEach((strataContexts) => {
            strataContexts.forEach(({ stratum, contextDepth, targetDepth }) => {
                // Walk through tree and set value into name label count object
                nameLabelCounts[stratum._id] = contextTargetCountWalker(tree, contextDepth, targetDepth, 0);
            });
        });

        return nameLabelCounts;
    },

    [G.POSSIBLE_GROUP_SIZES_FOR_EACH_STRATUM](state: State, getters: any) {
        const strata = state.strataConfig.strata;
        const strataSizes = strata.map(s => s.size);

        // TODO: Fix with type-safe accessors
        const partitions = getters[G.EXPECTED_PARTITIONS] as ReadonlyArray<Partition.Partition>;

        // Run group sizing in each partition, and merge the distributions at
        // the end
        try {
            const strataGroupSizes =
                partitions
                    .map((partition) => {
                        // Generate group sizes for each partition
                        const numberOfRecordsInPartition = Partition.getNumberOfRecords(partition);
                        const strataIndividualGroupSizes = StratumSize.generateStrataGroupSizes(strataSizes, numberOfRecordsInPartition);

                        // Find the min, max of each stratum
                        const strataMinMax = strataIndividualGroupSizes.map((sizes) => {
                            return {
                                min: Math.min(...sizes),
                                max: Math.max(...sizes),
                            };
                        });

                        return strataMinMax;
                    })
                    .reduce((carry, newStrataMinMax) => {
                        // Merge min, max of each strata
                        return carry.map((existingStratumMinMax, i) => {
                            return {
                                min: Math.min(existingStratumMinMax.min, newStrataMinMax[i].min),
                                max: Math.max(existingStratumMinMax.max, newStrataMinMax[i].max),
                            };
                        });
                    });

            // Multiply through each stratum
            //
            // We abuse `Array#reduceRight()` by modifying the elements of
            // `strataGroupSizes` as we go
            strataGroupSizes.reduceRight((carry, strataMinMax) => {
                // We multiply out the minimums and maximums as we go up strata
                strataMinMax.min *= carry.min;
                strataMinMax.max *= carry.max;

                // Return the (now modified) object across to the next round
                return strataMinMax;
            });

            // Finally zip up the results in an object with sane stratum ID
            // lookup
            return strata.reduce<Record<string, ReadonlyArray<number>>>((sizes, stratum, i) => {
                // Get stratum group min, max information
                const { min, max } = strataGroupSizes[i];

                // Generate array that spans [min, ..., max]
                sizes[stratum._id] = Array.from({ length: max - min + 1 }, (_, i) => i + min);

                return sizes;
            }, {});

        } catch {
            // If error occurs, return empty arrays for each stratum
            return strata.reduce<Record<string, ReadonlyArray<number>>>((sizes, stratum) => Object.assign(sizes, { [stratum._id]: [] }), {});
        }
    },

    [G.IS_ANNEAL_ABLE_TO_BE_EXECUTED](_state: State, getters: any) {
        // TODO: Fix with type-safe accessors
        return (
            !getters[G.IS_ANNEAL_REQUEST_IN_PROGRESS]
            && getters[G.HAS_CONFIG_AND_SOURCE_FILE_DATA]
            && getters[G.HAS_VALID_PARTITION_COLUMN]
            && getters[G.HAS_STRATA]
            && getters[G.IS_STRATA_CONFIG_NAMES_VALID]
            && getters[G.HAS_CONSTRAINTS]
            && getters[G.ARE_ALL_CONSTRAINTS_VALID]
        ) as boolean;
    },
}

export function init() {
    return getters as GetterTree<State, State>;
}
