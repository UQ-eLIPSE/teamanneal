<template>
    <div id="spreadsheet">
        <table>
            <thead>
                <tr class="header">
                    <th v-for="(column, i) in columnData"
                        :key="i">
                        <template>
                            <span class="cell-content">{{ column.label }}</span>
                        </template>
                    </th>
                </tr>
            </thead>
            <tbody>
                <SpreadsheetTreeViewItem v-for="(item, i) in flattenedTree"
                                         :key="i"
                                         :item="item"
                                         :columnData="columnData"></SpreadsheetTreeViewItem>
            </tbody>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { ColumnData, Data as IColumnData } from "../data/ColumnData";
import { ResultTree, Node as IResultTree_Node, NodeNameMapNameGenerated as IResultTree_NodeNameMapNameGenerated, StratumNode as IResultTree_StratumNode, PartitionContextShimNode as IResultTree_PartitionContextShimNode } from "../data/ResultTree";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";

import SpreadsheetTreeViewItem from "./SpreadsheetTreeViewItem.vue";

/**
 * Flattens the result tree into a form that can be used to construct table rows
 * for SpreadsheetTreeView* components
 */
function flatten(recordRows: (number | string | null)[][], nameMap: IResultTree_NodeNameMapNameGenerated, consolidatedNameFormat: string | undefined, treeWalkAccumulator: IResultTree_Node[], nodes: ReadonlyArray<IResultTree_StratumNode>, flattenedArray: FlattenedTreeItem[]) {
    // How deep have we walked this tree so far?
    const depth = treeWalkAccumulator.length;

    nodes.forEach((node) => {
        // Fetch name
        const nameDesc = nameMap.get(node);
        if (nameDesc === undefined) {
            throw new Error("Could not find name description object for node");
        }
        const { stratumLabel, nodeGeneratedName } = nameDesc;

        if (node.childrenAreRecords === true) {
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

                [...treeWalkAccumulator, node].forEach((node) => {
                    if (node.type === "stratum") {
                        const nameDesc = nameMap.get(node);
                        let generatedName: string;

                        if (nameDesc === undefined) {
                            generatedName = "[?]";
                        } else {
                            generatedName = nameDesc.nodeGeneratedName;
                        }

                        consolidatedName = consolidatedName.replace(`{{${node.stratum.label}}}`, generatedName);
                    }
                });

                flattenedTreeItem.content += ` (${consolidatedName})`;
            }

            // Push the label of this node (which is an actual group) in
            flattenedArray.push(flattenedTreeItem);

            // Push records
            node.children.forEach((recordNode) => {
                // Fetch record
                const record = recordRows[recordNode.index];

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

            // Create flattened tree item
            const flattenedTreeItem: FlattenedTreeItem = {
                content: `${stratumLabel} ${nodeGeneratedName}`,
                depth,
            };

            // Push stratum label
            flattenedArray.push(flattenedTreeItem);

            // Recurse into children
            flatten(recordRows, nameMap, consolidatedNameFormat, [...treeWalkAccumulator, node], node.children, flattenedArray);
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
    @Prop annealResultTreePartitionNodeArray = p<ReadonlyArray<IResultTree_PartitionContextShimNode>>({ type: Array, required: true, });
    @Prop columnData = p<ReadonlyArray<IColumnData>>({ type: Array, required: true, });
    @Prop consolidatedNameFormat = p<string | undefined>({ type: String, required: false, default: undefined });

    get flattenedTree() {
        // Get record rows
        const recordRows = ColumnData.TransposeIntoCookedValueRowArray(this.columnData);

        // Get name map
        const partitionNodes = this.annealResultTreePartitionNodeArray;
        const nameMap = ResultTree.GenerateNodeNameMap(partitionNodes);

        // Flatten partitions into one large array before passing to `flatten()`
        const nodes = ResultTree.FlattenPartitionNodes(partitionNodes);

        const flattenedArray: FlattenedTreeItem[] = [];
        flatten(recordRows, nameMap, this.consolidatedNameFormat, [], nodes, flattenedArray);

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
