<template>
    <div class="constraint-satisfaction-dashboard">
        <h2>Dashboard</h2>
        <label class="filter">Filter
            <select v-model="selectedStratum">
                <option v-for="stratum in strata"
                        :key="stratum._id"
                        :value="stratum">By {{stratum.label}}</option>
            </select>
        </label>
        <div class="constraints-container">
            <!-- TODO: Decide what `getConstraintFulfilledPercentage` returns -->
            <ConstraintSatisfactionDashboardConstraint v-for="constraint in constraintsArray"
                                                       :key="constraint._id"
                                                       :selectedStratum="selectedStratum"
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
    /** Flattened tree generated from anneal node root */
    @Prop flattenedTree = p<FlattenedTreeItem[]>({ required: true, });

    /** Stores stratum for filtering constraints */
    private filterStratum: IStratum | undefined = undefined;

    get selectedStratum() {
        return this.filterStratum || this.strata[0];
    }

    set selectedStratum(stratum: IStratum) {
        this.filterStratum = stratum;
    }

    /**
     * Returns store state
     */
    get state() {
        return this.$store.state as IState;
    }

    /**
     * Returns constraints applicable to currently selected stratum
     */
    get constraintsArray() {
        return this.state.annealConfig.constraints.filter((constraint) => constraint.stratum === this.selectedStratum._id);
    }

    /**
     * Returns strata from state store
     */
    get strata() {
        return this.state.annealConfig.strata;
    }

    /**
     * Handles `constraintSelected` event emitted from 
     * `ConstraintSatisfactionDashboardConstraint` component.
     */
    handleConstraintClicked(constraint: IConstraint) {
        this.$emit("constraintSelected", constraint);
    }

    /**
     * TODO: Decide the value that this function should return.
     * At the moment in the UI, this number is displayed as "x% of groups match" - which is incorrect.
     * This function actually returns the average satisfaction value of a specific constraint across strata. 
     * @param constraint Constraint
     */
    getConstraintFulfilledPercentage(constraint: IConstraint) {

        /** Tree items to which `constraint` is applicable */
        // Constraint applicability conditions:
        // 1. `satisfaction` exists on tree item
        // 2. `satisfaction` value for this constraint is not falsy (except 0)   
        const applicableTreeItems = this.flattenedTree.filter((treeItem) =>
            treeItem.satisfaction &&
            (treeItem.satisfaction[constraint._id] || treeItem.satisfaction[constraint._id] === 0));


        const constraintScores = applicableTreeItems.map((treeItem) => treeItem.satisfaction![constraint._id] as number);

        // Since we do not have a "match" condition, `totalScore` is basically the 
        // average satisfaction value for a constraint over all strata that said constraint applies to.
        const totalScore = constraintScores.reduce((sum, score) => sum + score, 0);

        const fulfilledPercentage = (totalScore / constraintScores.length) * 100;

        return fulfilledPercentage;
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