<template>
    <div id="spreadsheet">
        <table>
            <thead>
                <tr class="header">
                    <th v-for="(label, i) in headerRow"
                        :key="i">
                        <template>
                            <span class="cell-content">{{ label }}</span>
                        </template>
                    </th>
                </tr>
            </thead>
            <tbody>
                <SpreadsheetTreeViewItem v-for="(item, i) in flattenedTree"
                                         :key="i"
                                         :item="item"
                                         :numberOfColumns="numberOfColumns"></SpreadsheetTreeViewItem>
            </tbody>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as AnnealNode from "../../../common/AnnealNode";

import { NodeNameMapNameGenerated as IResultTree_NodeNameMapNameGenerated } from "../data/ResultTree";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";

import SpreadsheetTreeViewItem from "./SpreadsheetTreeViewItem.vue";

/**
 * Flattens the result tree into a form that can be used to construct table rows
 * for SpreadsheetTreeView* components
 */
function flatten(recordRows: ReadonlyArray<ReadonlyArray<number | string | null>>, idColumnIndex: number, nameMap: IResultTree_NodeNameMapNameGenerated, consolidatedNameFormat: string | undefined, treeWalkAccumulator: AnnealNode.Node[], flattenedArray: FlattenedTreeItem[], nodes: ReadonlyArray<AnnealNode.Node>) {
    // How deep have we walked this tree so far?
    const depth = treeWalkAccumulator.length;

    nodes.forEach((node) => {
        // Fetch name
        const nameDesc = nameMap.get(node);
        if (nameDesc === undefined) {
            throw new Error("Could not find name description object for node");
        }
        const { stratumId, stratumLabel, nodeGeneratedName } = nameDesc;

        if (node.type === "stratum-records") {
            // Node is terminal; contains records, not more strata

            // Create flattened tree item
            const flattenedTreeItem: FlattenedTreeItem = {
                content: `${stratumLabel} ${nodeGeneratedName}`,
                depth,
            };

            // If a consolidated name format is supplied, then gather up all 
            // generated names by walking up
            if (consolidatedNameFormat !== undefined) {
                // Get the generated name for this stratum label and 
                // replace it in the consolidated name string
                let consolidatedName = consolidatedNameFormat;

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

                    // NOTE: This uses the stratum ID rather than the label
                    // and so the templating part is not generally intended 
                    // to be constructed by hand
                    consolidatedName = consolidatedName.replace(`{{${stratumId}}}`, generatedName);
                });

                flattenedTreeItem.content += ` (${consolidatedName})`;
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
                    depth,
                };

                // Insert records
                flattenedArray.push(flattenedTreeItem);
            });

        } else {
            // Node contains further strata underneath

            // We ignore partitions for now because there is no clear way of 
            // handling how to show partitions
            //
            // TODO: Work out how to encode partitions properly as part of the
            // the naming process
            if (stratumId !== "_PARTITION") {
                // Create flattened tree item
                const flattenedTreeItem: FlattenedTreeItem = {
                    content: `${stratumLabel} ${nodeGeneratedName}`,
                    depth,
                };

                // Push stratum label
                flattenedArray.push(flattenedTreeItem);
            }

            // Recurse into children
            flatten(recordRows, idColumnIndex, nameMap, consolidatedNameFormat, [...treeWalkAccumulator, node], flattenedArray, node.children);
        }
    });
}

@Component({
    components: {
        SpreadsheetTreeViewItem,
    },
})
export default class SpreadsheetTreeView extends Vue {
    // Props
    @Prop annealNodeRoots = p<ReadonlyArray<AnnealNode.NodeRoot>>({ type: Array, required: true, });
    @Prop headerRow = p<ReadonlyArray<string>>({ type: Array, required: true, });
    @Prop recordRows = p<ReadonlyArray<ReadonlyArray<number | string | null>>>({ type: Array, required: true, });
    @Prop nameMap = p<IResultTree_NodeNameMapNameGenerated>({ required: true, });
    @Prop idColumnIndex = p<number>({ type: Number, required: true, });
    @Prop numberOfColumns = p<number>({ type: Number, required: true, });
    @Prop consolidatedNameFormat = p<string | undefined>({ type: String, required: false, default: undefined });

    get flattenedTree() {
        const flattenedArray: FlattenedTreeItem[] = [];
        flatten(this.recordRows, this.idColumnIndex, this.nameMap, this.consolidatedNameFormat, [], flattenedArray, this.annealNodeRoots);

        return flattenedArray;
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
#spreadsheet {
    overflow: scroll;
}

table {
    border-collapse: collapse;
}

th {
    border: 1px solid #ddd;
    text-align: inherit;

    background: #49075E;
    color: #fff;
    font-weight: 400;
    padding: 0.5em;
}
</style>
