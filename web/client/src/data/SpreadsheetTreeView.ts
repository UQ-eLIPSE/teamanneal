import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";
import * as ConstraintSatisfaction from "../../../common/ConstraintSatisfaction";

import { NodeNameMapNameGenerated as IResultTree_NodeNameMapNameGenerated } from "../data/ResultTree";

import { replaceAll } from "../util/String";

export interface FlattenedTreeItem {
    content: string | Record.Record,
    satisfaction: ConstraintSatisfaction.NodeSatisfactionObject | undefined,
    depth: number,
}

/**
 * Flattens the result tree into a form that can be used to construct table rows
 * for SpreadsheetTreeView* components
 */
export function flattenNodes(
    recordRows: ReadonlyArray<ReadonlyArray<number | string | null>>,
    idColumnIndex: number,
    nameMap: IResultTree_NodeNameMapNameGenerated,
    combinedNameFormat: string | undefined,
    hidePartitions: boolean,
    satisfactionMap: ConstraintSatisfaction.SatisfactionMap,
    treeWalkAccumulator: AnnealNode.Node[],
    flattenedArray: FlattenedTreeItem[],
    nodes: ReadonlyArray<AnnealNode.Node>,
) {

    // How deep have we walked this tree so far?
    let depth = treeWalkAccumulator.length;

    // If we hide partitions, the depth decreases to align with the "missing"
    // node
    if (hidePartitions) {
        --depth;
    }

    nodes.forEach((node) => {
        // Fetch name
        const nameDesc = nameMap.get(node);
        if (nameDesc === undefined) {
            throw new Error("Could not find name description object for node");
        }
        const { stratumLabel, nodeGeneratedName } = nameDesc;

        // Get satisfaction
        const satisfaction: ConstraintSatisfaction.NodeSatisfactionObject | undefined = satisfactionMap[node._id];

        if (node.type === "stratum-records") {
            // Node is terminal; contains records, not more strata

            // Create flattened tree item
            const flattenedTreeItem: FlattenedTreeItem = {
                content: `${stratumLabel} ${nodeGeneratedName}`,
                satisfaction,
                depth,
            };

            // If a combined name format is supplied, then gather up all 
            // generated names by walking up
            if (combinedNameFormat !== undefined) {
                // Get the generated name for this stratum label and 
                // replace it in the combined name string
                let combinedName = combinedNameFormat;

                [...treeWalkAccumulator, node].forEach((accumulatedNode) => {
                    const nameDesc = nameMap.get(accumulatedNode);
                    let generatedName: string;

                    if (nameDesc === undefined) {
                        generatedName = "[?]";
                    } else {
                        generatedName = nameDesc.nodeGeneratedName || "[?]";
                    }

                    // Get the stratum ID to be used for replacement template
                    let stratumId: string;

                    if (accumulatedNode.type === "root") {
                        // Partitions have a shim stratum ID = "_PARTITION"
                        //
                        // TODO: Make the partition case more streamlined
                        // with normal stratum
                        stratumId = "_PARTITION";
                    } else {
                        stratumId = accumulatedNode.stratum;
                    }

                    // NOTE: This uses the stratum ID and not the label!
                    combinedName = replaceAll(combinedName, `{{${stratumId}}}`, generatedName);
                });

                flattenedTreeItem.content += ` (${combinedName})`;
            }

            // Push the label of this node (which is an actual group) in
            flattenedArray.push(flattenedTreeItem);

            // Push records
            node.recordIds.forEach((recordId) => {
                // Fetch record
                const record = recordRows.find(row => row[idColumnIndex] === recordId);

                if (record === undefined) {
                    throw new Error(`Record "${recordId}" not found`);
                }

                // Create flattened tree item
                const flattenedTreeItem: FlattenedTreeItem = {
                    content: record,
                    satisfaction: undefined,    // There are no satisfaction values for individual records
                    depth,
                };

                // Insert records
                flattenedArray.push(flattenedTreeItem);
            });

        } else {
            // Node contains further strata underneath

            // Add a new flattened tree item unless we've explicitly turned off
            // partitions and the node is the partition node (root)
            if (!(hidePartitions && node.type === "root")) {
                // Create flattened tree item
                const flattenedTreeItem: FlattenedTreeItem = {
                    content: `${stratumLabel} ${nodeGeneratedName}`,
                    satisfaction,
                    depth,
                };

                // Push stratum label
                flattenedArray.push(flattenedTreeItem);
            }

            // Recurse into children
            flattenNodes(recordRows, idColumnIndex, nameMap, combinedNameFormat, hidePartitions, satisfactionMap, [...treeWalkAccumulator, node], flattenedArray, node.children);
        }
    });
}
