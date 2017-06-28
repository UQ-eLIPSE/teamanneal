<template>
    <div id="spreadsheet">
        <table>
            <thead>
                <tr class="header">
                    <th v-for="column in columnInfo">
                        <template>
                            <span class="cell-content">{{ column.label }}</span>
                        </template>
                    </th>
                </tr>
            </thead>
            <tbody>
                <SpreadsheetTreeViewItem v-for="item in flattenedTree"
                                         :item="item"
                                         :columnInfo="columnInfo"></SpreadsheetTreeViewItem>
            </tbody>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as Record from "../../../common/Record";

import * as AnnealAjax from "../data/AnnealAjax";
import * as ColumnInfo from "../data/ColumnInfo";

import SpreadsheetTreeViewItem from "./SpreadsheetTreeViewItem.vue";

function flatten(flattenedArray: (string | Record.Record)[], node: AnnealAjax.ResultArrayNode) {
    if (node.children !== undefined) {
        // Push in group heading if not root
        // if (!node.isRoot) {
            flattenedArray.push(`${node.label}`);
        // }

        // Recurse into children
        node.children.forEach((childNode) => flatten(flattenedArray, childNode));
    } else {
        // Insert record
        flattenedArray.push(node.content!);
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
    @Prop columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo> = p({ type: Array, required: true, }) as any;

    get flattenedTree() {
        return flatten([], this.tree.children);
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
    padding: 0.3em 0.5em;
    text-align: inherit;

    background: #49075E;
    color: #fff;
    font-weight: 400;
    padding: 0.5em;
}
</style>
