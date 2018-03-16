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
                                                       :constraint="constraint"
                                                       :isSelected="isConstraintSelected(constraint)"
                                                       :selectedStratum="selectedStratum"
                                                       :fulfilledPercentage="getConstraintFulfilledPercentage(constraint)"
                                                       @constraintSelected="onConstraintSelected"> </ConstraintSatisfactionDashboardConstraint>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";
import { Data as IStratum } from "../data/Stratum";
import { SatisfactionMap } from "../../../common/ConstraintSatisfaction";

import ConstraintSatisfactionDashboardConstraint from "./ConstraintSatisfactionDashboardConstraint.vue";

@Component({
    components: {
        ConstraintSatisfactionDashboardConstraint
    }
})
export default class ConstraintSatisfactionDashboard2 extends Vue {
    @Prop constraintSatisfactionMap = p<SatisfactionMap>({ required: true, });

    /** Constraint to indicate as "selected" */
    @Prop selectedConstraint = p<IConstraint>({ required: false, });

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

    get constraintToNodeMap() {
        const csMap = this.constraintSatisfactionMap;

        return Object.keys(csMap).reduce<{ [constraintId: string]: string[] }>((carry, nodeId) => {
            const nodeSatisfaction = csMap[nodeId];

            Object.keys(nodeSatisfaction).forEach((constraintId) => {
                let constraintToNodeArray = carry[constraintId];

                if (constraintToNodeArray === undefined) {
                    constraintToNodeArray = (carry[constraintId] = []);
                }

                constraintToNodeArray.push(nodeId);
            });

            return carry;
        }, {});
    }

    isConstraintSelected(constraint: IConstraint) {
        if (this.selectedConstraint === undefined) {
            return false;
        }

        return this.selectedConstraint._id === constraint._id;
    }

    /**
     * Handles `constraintSelected` event emitted from 
     * `ConstraintSatisfactionDashboardConstraint` component.
     */
    onConstraintSelected(constraint: IConstraint) {
        this.$emit("constraintSelected", constraint);
    }

    /**
     * TODO: Decide the value that this function should return.
     * At the moment in the UI, this number is displayed as "x% of groups match" - which is incorrect.
     * This function actually returns the average satisfaction value of a specific constraint across strata. 
     * @param constraint Constraint
     */
    getConstraintFulfilledPercentage(constraint: IConstraint) {
        const constraintId = constraint._id;
        const nodesUnderConstraint = this.constraintToNodeMap[constraintId];

        const satisfactionSum =
            nodesUnderConstraint.reduce((sum, nodeId) => {
                const satisfactionValue = this.constraintSatisfactionMap[nodeId][constraintId]!;
                return sum + satisfactionValue;
            }, 0);

        const satisfactionPercentage = satisfactionSum / nodesUnderConstraint.length * 100;

        return satisfactionPercentage;
    }
}
</script>


<style scoped>
.constraint-satisfaction-dashboard {
    display: flex;
    align-items: center;
    flex-direction: column;
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
