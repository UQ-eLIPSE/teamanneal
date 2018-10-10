<template>
    <tr class="header">
        <th v-once
            v-for="n in padCells"
            :key="n"
            class="blank"></th>
        <th v-for="(label, i) in headerRow"
            :key="i"
            :style="dataColumnStyle(i)">{{ label }}</th>

        <th v-for="(inter, i) in intermediateConstraints"
            :key="inter._id" :style="dataColumnStyle(i + headerRow.length)">
            {{intermediateLabel + (i + 1)}}
        </th>

        <th v-for="(leaf, i) in leafConstraints"
            :key="leaf._id" :style="dataColumnStyle(i + intermediateConstraints.length + headerRow.length)">
            {{ leafLabel + (i + 1) }}
        </th>
    </tr>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { ResultsEditor as S } from "../store";

@Component
export default class SpreadsheetTreeView2Header extends Vue {
    // Props
    @Prop padCells = p({ type: Number, required: false, default: 0 });
    @Prop headerRow = p<ReadonlyArray<string>>({ type: Array, required: true, });
    @Prop headerStyles = p<ReadonlyArray<{ color?: string, backgroundColor?: string } | undefined>>({ type: Array, required: false, default: () => [] });
    @Prop columnWidths = p<ReadonlyArray<number>>({ type: Array, required: false, });

    dataColumnStyle(i: number) {
        // If no width information is available, no style is applied
        if (this.columnWidths === undefined) {
            return undefined;
        }

        // The column widths include pad cell widths too, so we need to
        // offset by the number `padCells`
        const cellWidth = `${this.columnWidths[i + this.padCells]}px`;

        // Fetch any other styles if present
        const otherStyles = this.headerStyles[i] || {};

        return {
            ...otherStyles,
            width: cellWidth,
            minWidth: cellWidth,
            maxWidth: cellWidth,
        };
    }

    // At the moment we assume a 3 level system and also root is not placed in the strata
    get leafLabel() {
        return S.state.strataConfig.strata.length == 2 ? S.state.strataConfig.strata[1].label[0] + "C" : "";
    }

    /**
     * E.g. returns TC if the intermediate label is Team
     */
    get intermediateLabel() {
        return S.state.strataConfig.strata.length >= 1 ? S.state.strataConfig.strata[0].label[0] + "C" : "";
    }

    get stratumIdToStratumTypeMap() {
        return S.get(S.getter.GET_STRATUM_ID_TO_TYPE_MAP)
    }

    get constraints() {
        return S.state.constraintConfig.constraints;
    }
    
    get intermediateConstraints() {
        return this.constraints.filter(c => {
            return this.stratumIdToStratumTypeMap[c.stratum] === "intermediate-stratum"; 
        })
    }

    get leafConstraints() {
        return this.constraints.filter(c => {
            return this.stratumIdToStratumTypeMap[c.stratum] === "leaf-stratum"; 
        })
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
