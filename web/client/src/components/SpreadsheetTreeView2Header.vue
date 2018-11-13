<template>
    <tr class="header">
        <th v-once
            v-for="n in padCells"
            :key="n"
            class="blank"></th>
        <th v-for="(label, i) in headerRow"
            :key="i"
            :style="dataColumnStyle(i)">{{ label }}</th>

        <!-- Due to the style being computed based on two things, have to use Object.assign -->
        <th v-for="(constraint, i) in orderedConstraints"
            :key="constraint._id"
            :style="dataColumnStyle(i + headerRow.length, constraint)"
            @mouseover="enableHover(constraint._id)"
            @mouseleave="disableHover()">
            {{"C" + (i + 1)}}
        </th>
    </tr>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { ResultsEditor as S } from "../store";
import { Data as Constraint } from "../data/Constraint";
@Component
export default class SpreadsheetTreeView2Header extends Vue {
    // Props
    @Prop padCells = p({ type: Number, required: false, default: 0 });
    @Prop headerRow = p<ReadonlyArray<string>>({ type: Array, required: true, });
    @Prop headerStyles = p<ReadonlyArray<{ color?: string, backgroundColor?: string } | undefined>>({ type: Array, required: false, default: () => [] });
    @Prop columnWidths = p<ReadonlyArray<number>>({ type: Array, required: false, });
      /** The constraint ID that's being hovered */
    @Prop hoverID = p<String>({ required: false, default: "" });

    get strata() {
        return S.state.strataConfig.strata;
    }


    dataColumnStyle(i: number, constraint: Constraint | undefined) {
        // If no width information is available, no style is applied
        if (this.columnWidths === undefined) {
            return undefined;
        }
        // The column widths include pad cell widths too, so we need to
        // offset by the number `padCells`
        const cellWidth = `${this.columnWidths[i + this.padCells]}px`;

        // Fetch any other styles if present
        const otherStyles = this.headerStyles[i] || {};

        let styles = {
            ...otherStyles,
            width: cellWidth,
            minWidth: cellWidth,
            maxWidth: cellWidth,
            border: '1px solid transparent'

        };

        if (constraint !== undefined && constraint._id === this.hoverID) {

            const constraintHoverStyles = {
                borderColor: '#45075e',
                backgroundColor: '#EEEEEE',
                color: '#49075e',
                fontWeight: 'bold'
            }

            styles = Object.assign({}, styles, constraintHoverStyles);
        }

        return styles;
    }

    // Change the hover id
    enableHover(constraintID: string | undefined) {
        if (constraintID) {
            this.$emit("on-header-hover", constraintID);
        }
    }

    // Remove the hover
    disableHover() {
        this.$emit("off-header-hover");
    }

    get stratumIdToStratumTypeMap() {
        return S.get(S.getter.GET_STRATUM_ID_TO_TYPE_MAP)
    }

    get constraints() {
        return S.state.constraintConfig.constraints;
    }

    get orderedConstraints() {
        return S.get(S.getter.GET_ORDERED_CONSTRAINTS);
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
