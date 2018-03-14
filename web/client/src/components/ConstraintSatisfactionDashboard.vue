<template>
    <div class="constraint-satisfaction-dashboard">
        <h2>Dashboard</h2>
        <label class="filter">Filter
            <select v-model="currentStratum">
                <option v-for="stratum in strata"
                        :key="stratum._id"
                        :value="stratum">By {{stratum.label}}</option>
            </select>
        </label>
        <div class="constraints-container">

            <ConstraintSatisfactionDashboardConstraint v-for="constraint in constraintsArray"
                                                       :key="constraint._id"
                                                       :currentStratum="currentStratum"
                                                       :fulfilledPercentage="getConstraintFulfilledPercentage(constraint)"
                                                       @constraintSelected="handleConstraintClicked"
                                                       :constraint="constraint"> </ConstraintSatisfactionDashboardConstraint>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";
import { FlattenedTreeItem } from "../data/SpreadsheetTreeView";
import ConstraintSatisfactionDashboardConstraint from "./ConstraintSatisfactionDashboardConstraint.vue";
import { Data as IStratum } from "../data/Stratum";

@Component({
    components: {
        ConstraintSatisfactionDashboardConstraint
    }
})
export default class ConstraintSatisfactionDashboard extends Vue {
    @Prop flattenedTree = p<FlattenedTreeItem[]>({ required: true, });
    private filterStratum: IStratum | undefined = undefined;

    get currentStratum() {
        return this.filterStratum || this.strata[0];
    }


    set currentStratum(stratum: IStratum) {
        this.filterStratum = stratum;
    }

    get state() {
        return this.$store.state as IState;
    }

    handleConstraintClicked(constraint: IConstraint) {
        console.log('selected constraint: ');
        console.log(constraint);

    }

    get constraintsArray() {
        return this.state.annealConfig.constraints.filter((constraint) => constraint.stratum === this.currentStratum._id);
    }

    get strata() {
        return this.state.annealConfig.strata;
    }

    getConstraintFulfilledPercentage(constraint: IConstraint) {
        let constraintScores: number[] = [];
        this.flattenedTree.forEach((treeItem) => {
            const treeItemSatisfaction = treeItem.satisfaction;
            if (treeItemSatisfaction === undefined) return;
            const treeItemConstraintIds = Object.keys(treeItemSatisfaction);
            if (treeItemConstraintIds.indexOf(constraint._id) !== -1) {
                // Constraint exists for current tree item
                constraintScores.push(treeItemSatisfaction[constraint._id] as number);
            }
        });
        const totalScore = constraintScores.reduce((totalScore, score) => totalScore + score, 0);
        const perc = (totalScore / constraintScores.length) * 100;
        return perc;
    }
}
</script>


<style scoped>
.constraint-satisfaction-dashboard {
    display: flex;
    align-items: center;
    flex-direction: column;
    background-color: #f2f2f2;
}

.filter {
    width: 100%;
    padding: 0.5em;
}

select {
    width: 100%;
    padding: 0.5rem;
    font-weight: 400;
    margin: 0.5rem;
    flex-shrink: 0;
    margin: 0.5rem 0 0.5rem 0
}

h2 {
    color: #49075E;
}

.constraints-container {
    display: flex;
    flex-direction: column;
    padding: 0.5em;
}

.constraints-container>* {
    margin: 0.1rem 0 0.1rem 0;
}

.constraint-box {
    border: 1px solid black;
}
</style>