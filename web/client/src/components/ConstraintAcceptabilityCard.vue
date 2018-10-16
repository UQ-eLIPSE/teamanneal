<template>
  <div class="main">
    <div class="constraint-item">
      <div class="sentence-groups">
        <div class="item-legend">
          <span>{{constraintLabelNumber}}</span>
        </div>
        <div class="sentence">
          <span>{{constraintSentence}}</span>

        </div>
        <div class="number-of-groups"
             :style="cardStyles">
          <span class="number">{{fulfilledNumber}}</span>
          <span class="number number-bottom">{{totalGroups}}</span>
          <span>pass</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IConstraint } from "../data/Constraint";
import { ConstraintSentence } from "../data/Constraint";

@Component
export default class ConstraintAcceptabilityCard extends Vue {
  @Prop constraint = p<IConstraint>({ required: true });

  /** Label of the stratum for which the constraint applies */
  @Prop stratumLabel = p({ type: String, required: true });

  /** Number of nodes that passed the constraint */
  @Prop fulfilledNumber = p({ type: Number, required: true });

  /** Total number of nodes to which this constraint applies */
  @Prop totalGroups = p({ type: Number, required: true });

  @Prop constraintIndexInStratum = p({ type: Number, required: true, default: 0 });

  get constraintFilterText() {
    return ConstraintSentence.getConstraintFilterText(this.constraint);
  }


  get constraintSentence() {
    return ConstraintSentence.convertConstraintToSentence(this.constraint, this.stratumLabel);
  }

  get cardStyles() {
    
    // Moved to a simple 3-color scheme so that the difference between colors can be ascertained easily.
    const background: string = (() => {
      if(this.fulfilledNumber === this.totalGroups) return 'rgb(0, 204, 0)';
      else if(this.fulfilledNumber === 0) return 'rgb(204, 0, 0)'
      else return '#ffc107'
    })() || '';

    return {
      background: background
    };
  }

  get constraintLabelNumber() {
    return (this.stratumLabel + "C") + (this.constraintIndexInStratum + 1);
  }
}
</script>

<style scoped>
.main {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  text-decoration: none;
}

.constraint-item {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  text-decoration: none;
  color: inherit;
  border: 0.2em solid rgba(0, 0, 0, 0.1);
  font-size: 0.8em;
  align-items: center;
  font-size: 1em;
  background: rgba(250, 250, 250, 0.9);
  position: relative;
}

.sentence-groups {
  display: flex;
  min-height: 5rem;
}

.sentence {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-items: center;
  padding: 0.5em;
}

.number-of-groups {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  min-width: 20%;
  padding: 0.5rem 0;
  flex-shrink: 0;
}

.number-of-groups .number {
  font-size: 1.1em;
  font-weight: bold;
}

.number-bottom {
  border-top: 1px solid white;
  padding-top: 0.3rem;
  margin-top: 0.3rem;
}

.item-legend {
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgb(240,240,240);
    font-weight: bold;
    color: #49075e;
    border-right: 0.1em solid rgba(1,0,0,0.05);
}
</style>
