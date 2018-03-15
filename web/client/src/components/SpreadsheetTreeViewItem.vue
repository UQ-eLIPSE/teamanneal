<template>
    <tr v-if="isItemGroupHeading">
        <!-- Group heading -->
        <td v-once
            class="group-heading"
            :data-depth="itemDepth"
            :colspan="numberOfColumns">
            <div class="satisfaction-table-data">
                <span class="group-heading-text"
                      :style="groupHeadingTextStyle">{{ itemContent }} {{ itemSatisfactionString }}</span>

                <div class="satisfaction-wrapper"
                     v-if="itemSatisfaction !== undefined && weightedAverageSatisfaction !== undefined">
                    <span>{{(weightedAverageSatisfaction*100).toFixed(0)}}%</span>

                    <!-- TODO: decide what is 'low' for the satisfaction meter -->
                    <meter class="satisfaction-meter"
                           :value="weightedAverageSatisfaction"
                           max="1"
                           min="0"
                           low="0.5"></meter>

                </div>
            </div>
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
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";
import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";

@Component
export default class SpreadsheetTreeViewItem extends Vue {
    // Props
    @Prop item = p<FlattenedTreeItem>({ required: true, });
    @Prop numberOfColumns = p<number>({ type: Number, required: true, });

    get itemDepth() {
        return this.item.depth;
    }

    get state() {
        return this.$store.state as IState;
    }

    get itemContent() {
        return this.item.content;
    }

    get itemSatisfaction() {
        const satisfaction = this.item.satisfaction;

        if (satisfaction === undefined || Object.keys(satisfaction).length === 0) {
            return undefined;
        }

        return Object.keys(satisfaction).sort().map(constraintId => satisfaction[constraintId]);
    }

    get weightedAverageSatisfaction() {
        if (this.itemSatisfaction !== undefined) {
            const constraints = this.getConstraintsFromState();
            const totalWeightedSum = constraints.map((constraint) => (constraint.satisfaction || 0) * constraint.constraintWeight)
                .reduce((sum, weightedSum) => sum + weightedSum, 0);
            const totalWeight = constraints.map((constraint) => constraint.constraintWeight)
                .reduce((totalSum, weight) => totalSum + weight, 0);

            if (!totalWeightedSum || !totalWeight) return 0;
            return totalWeightedSum / totalWeight;
        }
        return undefined;


    }


    getConstraintsFromState() {

        const satisfaction = this.item.satisfaction!;
        const constraintIdToConstraintObjectMap: { [key: string]: IConstraint } = {};

        // Create a map from constraintId:{constraint object from state} to avoid iterations for every constraint for current SpreadsheetTreeViewItem
        this.state.annealConfig.constraints.forEach((constraint) => {
            constraintIdToConstraintObjectMap[constraint._id] = constraint;
        });

        const currentStratumConstraints = Object.keys(satisfaction).map((constraintId) => (
            {
                constraintId: constraintId,
                satisfaction: satisfaction[constraintId],
                constraintWeight: constraintIdToConstraintObjectMap[constraintId].weight as number
            }));

        return currentStratumConstraints || [];
    }

    get itemSatisfactionString() {
        const satisfactionArray = this.itemSatisfaction;

        if (satisfactionArray === undefined) {
            return "";
        }

        return `[${satisfactionArray.toString()}]`;
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
    background: #059;
}

.group-heading[data-depth="2"] {
    background: #972;
}

.group-heading-text {
    display: inline-block;
}

.satisfaction-wrapper {
    display: inline-block;
    font-size: 0.8em;
}

.satisfaction-table-data {
    display: flex;
    justify-content: space-between;
}
</style>
