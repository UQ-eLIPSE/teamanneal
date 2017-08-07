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
import { ResultTree, NodeNameMapNameGenerated as IResultTree_NodeNameMapNameGenerated, StratumNode as IResultTree_StratumNode } from "../data/ResultTree";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";

import SpreadsheetTreeViewItem from "./SpreadsheetTreeViewItem.vue";

/**
 * Flattens the result tree into a form that can be used to construct table rows
 * for SpreadsheetTreeView* components
 */
function flatten(recordRows: (number | string | null)[][], nameMap: IResultTree_NodeNameMapNameGenerated, flattenedArray: FlattenedTreeItem[], depth: number, nodes: IResultTree_StratumNode[]) {
    nodes.forEach((node) => {
        if (node.childrenAreRecords) {
            // Node is terminal; contains records, not more strata

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

            const nameDesc = nameMap.get(node);

            if (nameDesc === undefined) {
                throw new Error("Could not find name description object for node");
            }

            const { stratumLabel, nodeGeneratedName } = nameDesc;

            // Create flattened tree item
            const flattenedTreeItem: FlattenedTreeItem = {
                content: `${stratumLabel} ${nodeGeneratedName}`,
                depth: depth++,     // Increment depth while we're at it
            };

            // Add basic label at this level
            flattenedArray.push(flattenedTreeItem);

            // Recurse into children
            flatten(recordRows, nameMap, flattenedArray, depth, node.children);
        }
    });

    return flattenedArray;
}

@Component({
    components: {
        SpreadsheetTreeViewItem,
    }
})
export default class SpreadsheetTreeView extends Vue {
    // Props
    @Prop annealResultTreeNodeArray: IResultTree_StratumNode[] = p({ type: Array, required: true, }) as any;
    @Prop columnData: ReadonlyArray<IColumnData> = p({ type: Array, required: true, }) as any;

    get flattenedTree() {
        // Get record rows
        const recordRows = ColumnData.TransposeIntoCookedValueRowArray(this.columnData);

        // Get name map
        const nodes = this.annealResultTreeNodeArray;
        const { nameMap } = ResultTree.GenerateNodeNameMap(nodes);

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
