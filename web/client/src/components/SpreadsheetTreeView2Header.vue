<template>
    <tr class="header">
        <th v-once
            v-for="n in padCells"
            :key="n"
            class="blank"></th>
        <th v-once
            v-for="(label, i) in headerRow"
            :key="i">{{ label }}</th>
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

    width: 2em;
    min-width: 2em;
    max-width: 2em;
}
</style>
