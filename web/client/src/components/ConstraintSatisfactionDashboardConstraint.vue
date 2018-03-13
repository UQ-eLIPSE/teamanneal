<template>
    <a class="constraint-item"
       href="#"
       @click.prevent.stop="selectConstraint">
        <h5>Constraint</h5>
        <h5>{{fulfilledPercentage}}</h5>
        <meter :value="fulfilledPercentage" max="100" low="0.5" min="0"></meter> 
        {{fulfilledPercentage}}% of {{currentStratum.label}}s match
        <p>{{constraint}}</p>
    </a>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";

@Component
export default class ConstraintSatisfactionDashboardConstraint extends Vue {
    @Prop constraint = p<IConstraint>({ required: true, });
    @Prop fulfilledPercentage = p<number>({ required: false, default: () => 0 });
    @Prop currentStratum = p<any>({required: false});
    get state() {
        return this.$store.state as IState;
    }

    selectConstraint() {
        this.$emit("constraintSelected", this.constraint);
    }

    get constraintsArray() {
        return this.state.annealConfig.constraints;
    }


}
</script>

<style scoped>
h5 {
    color: #49075E;
    font-size: 1em;
}

a.constraint-item {
    border: 1px solid rgba(1, 0, 0, 0.5);
    padding: 0.5em;
    font-size: 0.8em;
    text-decoration: none;
}

h3 {
    color: #49075E;
}

.constraints-container {
    display: flex;
    flex-direction: column;
}

.constraint-box {
    border: 1px solid black;
}
</style>