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
        <td v-for="(cell, i) in itemContent"
            :key="i"
            :class="cellClasses(cell)">
            <template v-if="cellContentVisible(cell)">{{ cell }}</template>
        </td>
    </tr>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { Data as IColumnData } from "../data/ColumnData";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";

@Component
export default class SpreadsheetTreeViewItem extends Vue {
    // Props
    @Prop item = p<FlattenedTreeItem>({ required: true, });
    @Prop columnData = p<ReadonlyArray<IColumnData>>({ type: Array, required: true, });

    get numberOfColumns() {
        return this.columnData.length;
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

    cellContentVisible(value: any) {
        return !Number.isNaN(value);
    }

    cellClasses(value: any) {
        const classes = {
            "cell-content": true,
            "nan": Number.isNaN(value),
            "null": value === null,
        }

        return classes;
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
