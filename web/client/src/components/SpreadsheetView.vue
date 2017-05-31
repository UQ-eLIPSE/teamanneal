<template>
    <div id="spreadsheet">
        <table>
            <tr v-for="row in rows">
                <td v-for="cell in row">
                    {{ cell }}
                </td>
            </tr>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

@Component
export default class SpreadsheetView extends Vue {
    // Props
    @Prop rows: ReadonlyArray<string | number> = p(Array) as any;
}
</script>

<!-- ####################################################################### -->

<style scoped>
#spreadsheet {
    /*position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;*/
    overflow: scroll;

    /*background: #fff;

    opacity: 1;

    transition: all 250ms ease-out;*/
}

#spreadsheet table {
    border-collapse: collapse;
}

#spreadsheet td,
#spreadsheet th {
    border: 1px solid #ddd;
    padding: 0.2em;
}

#spreadsheet td.num {
    text-align: right;
    color: blue;
}

#spreadsheet td.highlight,
#spreadsheet th.highlight {
    background: rgba(73, 7, 94, 0.3);
}
</style>
