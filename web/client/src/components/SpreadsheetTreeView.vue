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

import { Data as IColumnData } from "../data/ColumnData";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";

import SpreadsheetTreeViewItem from "./SpreadsheetTreeViewItem.vue";

/**
 * Flattens the result tree into a form that can be used to construct table rows
 * for SpreadsheetTreeView* components
 */
function flatten(flattenedArray: FlattenedTreeItem[], depth: number, node: AnnealAjax.ResultArrayNode) {
    if (node.children !== undefined) {
        // Push in group heading if not root
        if (!node.isRoot) {
            const flattenedTreeItem: FlattenedTreeItem = {
                content: `${node.stratumLabel} ${node.counterValue}`,
                depth: depth++,     // Increment depth while we're at it
            };

            flattenedArray.push(flattenedTreeItem);
        }

        // Recurse into children
        node.children.forEach((childNode) => flatten(flattenedArray, depth, childNode));
    } else {
        // Insert record
        const flattenedTreeItem: FlattenedTreeItem = {
            content: node.content!,
            depth,
        };

        flattenedArray.push(flattenedTreeItem);
    }

    return flattenedArray;
}

@Component({
    components: {
        SpreadsheetTreeViewItem,
    }
})
export default class SpreadsheetTreeView extends Vue {
    // Props
    @Prop tree: AnnealAjax.ResultArrayNode = p({ type: Object, required: true, }) as any;
    @Prop columnData: ReadonlyArray<IColumnData> = p({ type: Array, required: true, }) as any;

    get flattenedTree() {
        return flatten([], 0, this.tree);
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
