<template>
    <tr v-if="isItemGroupHeading">
        <!-- Group heading -->
        <td v-once
            class="group-heading"
            :data-depth="itemDepth"
            :colspan="numberOfColumns">
            <span class="group-heading-text"
                  :style="groupHeadingTextStyle">{{ itemContent }}</span>
        </td>
    </tr>
    <tr v-else>
        <template v-for="(cell, i) in itemContent"
                  :key="i">
            <!-- Don't display any content for NaN cells -->
            <td v-if="Number.isNaN(cell)"
                class="cell-content nan"></td>
    
            <!-- Normal cell content -->
            <td v-else
                class="cell-content"
                :class="{ 'null': cell === null, }">{{ cell }}</td>
        </template>
    </tr>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as ColumnInfo from "../data/ColumnInfo";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";

@Component
export default class SpreadsheetTreeViewItem extends Vue {
    // Props
    @Prop item: FlattenedTreeItem = p({ type: Object, required: true, }) as any;
    @Prop columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo> = p({ type: Array, required: true, }) as any;

    get numberOfColumns() {
        return this.columnInfo.length;
    }

    get itemDepth() {
        return this.item.depth;
    }

    get itemContent() {
        return this.item.content;
    }

    get isItemGroupHeading() {
        return typeof this.itemContent === "string";
    }

    get groupHeadingTextStyle() {
        return {
            marginLeft: `${this.itemDepth}em`,
        };
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
td,
th {
    border: 1px solid #ddd;
    padding: 0.3em 0.5em;
    text-align: inherit;
}

th {
    background: #49075E;
    color: #fff;
    font-weight: 400;
    padding: 0.5em;
}

th select.column-type,
th select.column-type option {
    background: #738;
    color: #fff;
}

th select.column-type {
    border: 1px solid rgba(255, 255, 255, 0.5);
    font-size: 0.7em;
}

.cell-content {
    white-space: pre;
}

.nan {
    background: #fee;
    color: #f00;
}

.nan::before {
    content: "Not a number";
    font-style: italic;
    font-size: 0.7em;
}

.null {
    background: #eef;
    color: #00f;
}

.null::before {
    content: "No value";
    font-style: italic;
    font-size: 0.7em;
}

.group-heading {
    background: #738;
    color: #fff;
    font-weight: 400;
}

.group-heading[data-depth="0"] {
    background: #738;
}

.group-heading[data-depth="1"] {
    background: #947b2f;
}

.group-heading-text {
    display: inline-block;
}
</style>
