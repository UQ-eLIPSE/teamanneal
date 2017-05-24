<template>
    <div id="constraint-group">
        Each
        <DynamicWidthSelect class="select" :list="strataSelectList" :selectedIndex="stratumIndex" @change="onStratumChange" />
        <div id="constraint-items">
            <ConstraintsEditorConstraintItem v-for="constraint in stratumConstraints" :key="constraint._id" :constraint="constraint" />
        </div>
        <button @click="addNewConstraint">Add new constraint</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as Stratum from "../data/Stratum";
import * as Constraint from "../data/Constraint";

import DynamicWidthSelect from "./DynamicWidthSelect.vue";
import ConstraintsEditorConstraintItem from "./ConstraintsEditorConstraintItem.vue";

@Component({
    components: {
        DynamicWidthSelect,
        ConstraintsEditorConstraintItem,
    },
})
export default class ConstraintEditorGroupItem extends Vue {
    // Props
    @Prop stratumConstraints = p(Array);

    get strata() {
        return this.$store.state.constraintsConfig.strata as ReadonlyArray<Stratum.Stratum>;
    }

    get stratumIndex() {
        // Read off the index from the first constraint we have
        const stratumConstraints = this.stratumConstraints!;
        return stratumConstraints[0]!.strata;
    }

    get strataSelectList() {
        return this.strata.map(stratum => ({
            value: stratum,
            text: stratum.label,
        }));
    }

    get thisGroupStratum() {
        return this.strata[this.stratumIndex];
    }










    onStratumChange(option: any) {
        const newStratum: Stratum.Stratum = option.value;
        const newStrataIndex = this.strata.findIndex(s => s._id === newStratum._id);

        this.stratumConstraints!.forEach(constraint => {
            // Shallow copy constraint and set new stratum index
            const newConstraint = { ...constraint };
            newConstraint.strata = newStrataIndex;

            const constraintUpdate: Constraint.Update = {
                constraint: newConstraint,
            }

            this.$store.commit("updateConstraintsConfigConstraint", constraintUpdate);
        });
    }

    addNewConstraint() {
        // TODO: Generate random constraint?
        const constraint: Constraint.Constraint = {
            _id: performance.now(),
            strata: this.stratumIndex,
            weight: 50,
            type: "count",
            filter: {
                column: 0,
                function: "eq",
                values: [
                    "some value"
                ]
            },
            condition: {
                function: "eq",
                value: 1
            },
            applicability: []
        }

        this.$store.commit("insertConstraintsConfigConstraint", constraint);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.select {
    background: none;

    border: 0;
    border-bottom: 0.1em dashed;

    color: #49075E;

    cursor: pointer;
}

#constraint-group {
    background: rgba(0, 0, 0, 0.05);

    padding: 0.5em;

    font-size: 1.5em;
}

#constraint-items {
    margin-left: 1em;
}
</style>
