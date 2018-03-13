<template>
    <div id="results-wrapper">
        <div id="spreadsheet">
            <table>
                <thead>
                    <tr class="header">
                        <th v-for="(label, i) in headerRow"
                            :key="i">
                            <template>
                                <span class="cell-content">{{ label }}</span>
                            </template>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <SpreadsheetTreeViewItem v-for="(item, i) in flattenedTree"
                                             :key="i"
                                             :item="item"
                                             :numberOfColumns="numberOfColumns"></SpreadsheetTreeViewItem>
                </tbody>
            </table>
        </div>
        <ConstraintSatisfactionDashboard class="satisfaction-dashboard"
                                         :flattenedTree="flattenedTree">

        </ConstraintSatisfactionDashboard>

    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as AnnealNode from "../../../common/AnnealNode";
import * as ConstraintSatisfaction from "../../../common/ConstraintSatisfaction";

import { NodeNameMapNameGenerated as IResultTree_NodeNameMapNameGenerated } from "../data/ResultTree";
import { FlattenedTreeItem, flattenNodes } from "../data/SpreadsheetTreeView";

import SpreadsheetTreeViewItem from "./SpreadsheetTreeViewItem.vue";
import ConstraintSatisfactionDashboard from "./ConstraintSatisfactionDashboard.vue";

@Component({
    components: {
        SpreadsheetTreeViewItem,
        ConstraintSatisfactionDashboard
    },
})
export default class SpreadsheetTreeView extends Vue {
    // Props
    @Prop annealNodeRoots = p<ReadonlyArray<AnnealNode.NodeRoot>>({ type: Array, required: true, });
    @Prop annealSatisfactionMap = p<ConstraintSatisfaction.SatisfactionMap>({ required: true, });
    @Prop headerRow = p<ReadonlyArray<string>>({ type: Array, required: true, });
    @Prop recordRows = p<ReadonlyArray<ReadonlyArray<number | string | null>>>({ type: Array, required: true, });
    @Prop nameMap = p<IResultTree_NodeNameMapNameGenerated>({ required: true, });
    @Prop idColumnIndex = p<number>({ type: Number, required: true, });
    @Prop numberOfColumns = p<number>({ type: Number, required: true, });
    @Prop combinedNameFormat = p<string | undefined>({ type: String, required: false, default: undefined });
    @Prop hidePartitions = p<boolean>({ type: Boolean, required: true, });

    get flattenedTree() {
        const flattenedArray: FlattenedTreeItem[] = [];

        flattenNodes(
            this.recordRows,
            this.idColumnIndex,
            this.nameMap,
            this.combinedNameFormat,
            this.hidePartitions,
            this.annealSatisfactionMap,
            [],
            flattenedArray,
            this.annealNodeRoots,
        );

        return flattenedArray;
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
#results-wrapper {
    display: flex;
}

.satisfaction-dashboard {
    width: 20%;
    overflow-y: scroll;
}

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
