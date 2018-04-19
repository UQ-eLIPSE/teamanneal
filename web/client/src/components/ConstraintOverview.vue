<template>
    <div class="constraint-overview">
        <h2>Constraints Overview</h2>
        <div class="constraints-container">
            <!-- TODO: Decide what `getConstraintFulfilledPercentage` returns -->
            <div class="stratum"
                 v-for="stratum in strata"
                 :key="stratum._id">
                <h2>{{stratum.label}} Constraints</h2>
                <ConstraintAcceptabilityCard v-for="constraint in getConstraintsArrayByStratum(stratum)"
                                             class="card"
                                             :key="constraint._id"
                                             :fulfilledNumber="getFulfilledNumberOfGroups(constraint)"
                                             :totalGroups="getNumberOfGroupsWithConstraintApplicable(constraint)"
                                             @constraintAcceptabilityChanged="constraintAcceptabilityChangeHandler"
                                             :stratumLabel="getStratumLabel(constraint)"
                                             :constraintThreshold="getConstraintThreshold(constraint)"
                                             :constraint="constraint"> </ConstraintAcceptabilityCard>
            </div>

        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
// import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";
// import { Data as IStratum } from "../data/Stratum";
import { SatisfactionMap } from "../../../common/ConstraintSatisfaction";
import { Data as IStratum } from "../data/Stratum";
import ConstraintAcceptabilityCard from "./ConstraintAcceptabilityCard.vue";

@Component({
    components: {
        ConstraintAcceptabilityCard
    }
})
export default class ConstraintOverview extends Vue {
    @Prop constraintSatisfactionMap = p<SatisfactionMap>({ required: true, });

    @Prop constraints = p<IConstraint[]>({ required: true });

    /** Constraint to indicate as "selected" */
    @Prop selectedConstraint = p<IConstraint>({ required: false, });

    @Prop strata = p<IStratum[]>({ required: true });

    @Prop constraintThresholdMap = p<{ [key: string]: number }>({ required: true });
    /**
     * Returns constraints applicable to currently selected stratum
     */
    get constraintsArray() {
        return this.constraints;
    }

    getFulfilledNumberOfGroups(constraint: IConstraint) {
        const nodesUnderConstraint = this.constraintToNodeMap[constraint._id];
        const count = nodesUnderConstraint.filter((nodeId) => (this.constraintSatisfactionMap[nodeId][constraint._id] as number) * 100 >= this.getConstraintThreshold(constraint)).length;
        return count;
    }

    getConstraintThreshold(constraint: IConstraint) {
        return this.constraintThresholdMap[constraint._id];
    }
    getNumberOfGroupsWithConstraintApplicable(constraint: IConstraint) {
        return this.constraintToNodeMap[constraint._id].length;
    }

    getStratumLabel(constraint: IConstraint) {
        return this.strata.find((stratum) => stratum._id === constraint.stratum)!.label;
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

    constraintAcceptabilityChangeHandler(constraint: IConstraint, newValue: number) {
        this.$emit("constraintAcceptabilityChanged", constraint, newValue);
    }

    getConstraintsArrayByStratum(stratum: IStratum) {
        return this.constraintsArray.filter((constraint) => constraint.stratum === stratum._id);
    }
}
</script>


<style scoped>
.constraint-overview {
    display: flex;
    align-items: center;
    flex-direction: column;
    background: rgba(245, 245, 245, 0.9);
    overflow-y: scroll;
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

.card {
    margin: 0.5rem 0;
}
</style>
