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
import { ResultTree, NodeNameMapNameGenerated as IResultTree_NodeNameMapNameGenerated, StratumNode as IResultTree_StratumNode, PartitionContextShimNode as IResultTree_PartitionContextShimNode } from "../data/ResultTree";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";

import SpreadsheetTreeViewItem from "./SpreadsheetTreeViewItem.vue";

/**
 * Flattens the result tree into a form that can be used to construct table rows
 * for SpreadsheetTreeView* components
 */
function flatten(recordRows: (number | string | null)[][], nameMap: IResultTree_NodeNameMapNameGenerated, flattenedArray: FlattenedTreeItem[], depth: number, nodes: ReadonlyArray<IResultTree_StratumNode>) {
    nodes.forEach((node) => {
        // Fetch name
        const nameDesc = nameMap.get(node);
        if (nameDesc === undefined) {
            throw new Error("Could not find name description object for node");
        }
        const { stratumLabel, nodeGeneratedName } = nameDesc;

        if (node.childrenAreRecords) {
            // Node is terminal; contains records, not more strata

            // Create flattened tree item
            const flattenedTreeItem: FlattenedTreeItem = {
                content: `${stratumLabel} ${nodeGeneratedName}`,
                depth,
            };

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

            // Recurse into children (depth increments by one down the tree)
            flatten(recordRows, nameMap, flattenedArray, depth + 1, node.children);
        }
    });

    return flattenedArray;
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

    get flattenedTree() {
        // Get record rows
        const recordRows = ColumnData.TransposeIntoCookedValueRowArray(this.columnData);

        // Get name map
        const partitionNodes = this.annealResultTreePartitionNodeArray;
        const nameMap = ResultTree.GenerateNodeNameMap(partitionNodes);

        // Flatten partitions into one large array before passing to `flatten()`
        const nodes = ResultTree.FlattenPartitionNodes(partitionNodes);

        return flatten(recordRows, nameMap, [], 0, nodes);
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
