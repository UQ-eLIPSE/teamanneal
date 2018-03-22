<template>
    <tr class="header">
        <th v-once
            v-for="n in padCells"
            :key="n"
            class="blank"></th>
        <th v-for="(label, i) in headerRow"
            :key="i"
            :style="dataColumnStyle(i)">{{ label }}</th>
    </tr>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

@Component
export default class SpreadsheetTreeView2Header extends Vue {
    // Props
    @Prop padCells = p({ type: Number, required: false, default: 0 });
    @Prop headerRow = p<ReadonlyArray<string>>({ type: Array, required: true, });
    @Prop columnWidths = p<ReadonlyArray<number>>({ type: Array, required: false, });

    dataColumnStyle(i: number) {
        // If no width information is available, no style is applied
        if (this.columnWidths === undefined) {
            return undefined;
        }

        // The column widths include pad cell widths too, so we need to
        // offset by the number `padCells`
        const cellWidth = `${this.columnWidths[i + this.padCells]}px`;

        return {
            width: cellWidth,
            minWidth: cellWidth,
            maxWidth: cellWidth,
        };
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
.header th {
    border: 1px solid #ddd;
    text-align: inherit;

    background: #49075e;
    color: #fff;
    font-weight: 400;
    padding: 0.5em;

    white-space: nowrap;

    /* Fixes missing border in some browsers when header is stickied */
    /* https://stackoverflow.com/a/41883019 */
    background-clip: padding-box;
}

.header th.blank {
    border: 0;
    padding: 0;

    width: 1em;
    min-width: 1em;
    max-width: 1em;
}
</style>
