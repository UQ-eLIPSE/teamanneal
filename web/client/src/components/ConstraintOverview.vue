<template>
  <div class="constraint-overview">
    <h2>Constraints Overview</h2>
    <div class="constraints-container">
      <div class="stratum"
           v-for="stratum in strata"
           v-if="getConstraintsArrayByStratum(stratum).length > 0"
           :key="stratum._id">
        <h2>{{stratum.label}} Constraints</h2>

        <ConstraintAcceptabilityCard v-for="constraint in getConstraintsArrayByStratum(stratum)"
                                     class="card"
                                     :key="constraint._id"
                                     :fulfilledNumber="getFulfilledNumberOfGroups(constraint)"
                                     :totalGroups="getNumberOfGroupsWithConstraintApplicable(constraint)"
                                     :stratumLabel="getStratumLabel(constraint)"
                                     :constraint="constraint"> </ConstraintAcceptabilityCard>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IConstraint } from "../data/Constraint";
import { SatisfactionMap } from "../../../common/ConstraintSatisfaction";
import { Stratum } from "../data/Stratum";
import ConstraintAcceptabilityCard from "./ConstraintAcceptabilityCard.vue";

@Component({
  components: {
    ConstraintAcceptabilityCard
  }
})
export default class ConstraintOverview extends Vue {
  @Prop constraintSatisfactionMap = p<SatisfactionMap>({ required: true });

  @Prop constraints = p<IConstraint[]>({ required: true });

  @Prop strata = p<Stratum[]>({ required: true });

  getFulfilledNumberOfGroups(constraint: IConstraint) {
    const nodesUnderConstraint = this.constraintToNodeMap[constraint._id];
    if (!nodesUnderConstraint) return 0;

    const count = nodesUnderConstraint.filter(nodeId => (this.constraintSatisfactionMap[nodeId][constraint._id] as number) === 1).length;

    return count;
  }

  getNumberOfGroupsWithConstraintApplicable(constraint: IConstraint) {
    const nodesUnderConstraint = this.constraintToNodeMap[constraint._id];
    if (!nodesUnderConstraint || !Array.isArray(nodesUnderConstraint)) return 0;
    return nodesUnderConstraint.length;
  }

  getStratumLabel(constraint: IConstraint) {
    return this.strata.find(stratum => stratum._id === constraint.stratum)!.label;
  }

  get constraintToNodeMap() {
    const csMap = this.constraintSatisfactionMap;

    return Object.keys(csMap).reduce<{ [constraintId: string]: string[] }>((carry, nodeId) => {
      const nodeSatisfaction = csMap[nodeId];

      Object.keys(nodeSatisfaction).forEach(constraintId => {
        let constraintToNodeArray = carry[constraintId];

        if (constraintToNodeArray === undefined) {
          constraintToNodeArray = carry[constraintId] = [];
        }

        constraintToNodeArray.push(nodeId);
      });

      return carry;
    }, {});
  }

  getConstraintsArrayByStratum(stratum: Stratum) {
    return this.constraints.filter(constraint => constraint.stratum === stratum._id);
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
  color: #49075e;
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
