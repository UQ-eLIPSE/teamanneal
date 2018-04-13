<template>
    <a class="constraint-item"
       :class="constraintItemClasses"
       href="#"
       @click.prevent.stop="selectConstraint">
        <h5>Constraint</h5>
        <p>{{constraintSentence}}</p>
        <!-- TODO: Decide what is "low" for non-binary satisfaction values -->
        <meter :value="fulfilledPercentage"
               max="100"
               low="50"
               min="0"></meter>
        {{fulfilledPercentage.toFixed(0)}}% of {{selectedStratum.label}}s match
    </a>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";
import { ConstraintSentence } from "../data/Constraint";

@Component
export default class ConstraintSatisfactionDashboardConstraint extends Vue {
    @Prop constraint = p<IConstraint>({ required: true, });

    @Prop isSelected = p({ type: Boolean, required: false, default: false, });

    /** Currently represents an average value of `constraint` satisfaction across strata */
    @Prop fulfilledPercentage = p<number>({ required: false, default: () => 0 });

    /** The currently selected stratum by parent component (for filtering constraints) */
    @Prop selectedStratum = p<any>({ required: false });

    /** Returns store state */
    get state() {
        return this.$store.state as IState;
    }

    /** Emits `constraintSelected` event when a constraint card is clicked */
    selectConstraint() {
        this.$emit("constraintSelected", this.constraint);
    }

    get constraintSentence() {
        return ConstraintSentence.convertConstraintToSentence(this.constraint, this.selectedStratum.label);
    }

    get constraintItemClasses() {
        return {
            "selected": this.isSelected,
        };
    }
}
</script>

<style scoped>
h5 {
    color: #49075E;
    font-size: 1.2em;
    margin: 0.2em;
    align-self: flex-start;
}

.constraint-item {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    text-decoration: none;
    color: inherit;
    border: 0.2em solid rgba(0, 0, 0, 0.1);
    padding: 0.5em;
    font-size: 0.8em;
    align-items: center;

    position: relative;
}

.constraint-item.selected {
    border-color: #49075E;
    background: rgba(73, 7, 94, 0.2);
}

.constraint-item.selected::after {
    content: "✓";
    display: inline-block;

    color: #fff;
    background: linear-gradient(to right top, transparent, transparent 50%, #49075E 50%, #49075E);
    font-weight: bold;
    text-align: right;

    position: absolute;
    top: 0;
    right: 0;

    width: 2em;
    height: 2em;
}

.constraints-container {
    display: flex;
    flex-direction: column;
}

.constraint-box {
    border: 1px solid black;
}

meter {
    width: 100%;
}
</style>
