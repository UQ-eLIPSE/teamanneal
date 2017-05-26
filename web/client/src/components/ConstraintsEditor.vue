<template>
    <div>
        <div id="constraint-groups">
            <ConstraintsEditorGroupItem class="constraint-group" v-for="stratumConstraints in stratumGroupedConstraints" :key="stratumConstraints._id" :stratumConstraints="stratumConstraints" />
        </div>
        <div>
            <button :disabled="strataWithoutConstraints.length === 0" @click="addNewGroupConstraints">Add group constraints</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as Stratum from "../data/Stratum";
import * as Constraint from "../data/Constraint";

import ConstraintsEditorGroupItem from "./ConstraintsEditorGroupItem.vue";

@Component({
    components: {
        ConstraintsEditorGroupItem,
    },
})
export default class ConstraintsEditor extends Vue {

    get strata() {
        return this.$store.state.constraintsConfig.strata as ReadonlyArray<Stratum.Stratum>;
    }

    get constraints() {
        return this.$store.state.constraintsConfig.constraints as ReadonlyArray<Constraint.Constraint>;
    }

    get strataWithConstraintsSet() {
        const strataSet = new Set<Stratum.Stratum>();
        const constraints = this.constraints;

        constraints.forEach((constraint) => {
            const stratumId = constraint.strata;
            const stratum = this.strata[stratumId];

            strataSet.add(stratum);
        });

        return strataSet;
    }

    get strataWithoutConstraints() {
        const strataWithConstraintsSet = this.strataWithConstraintsSet;
        return this.strata.filter(stratum => !strataWithConstraintsSet.has(stratum));
    }

    /** Constraints grouped by stratum ID */
    get stratumGroupedConstraints() {
        const stratumIds: number[] = [];
        const stratumGroupedConstraints: Constraint.Constraint[][] = [];
        const constraints = this.constraints;

        constraints.forEach((constraint) => {
            // Find which stratum this constraint belongs to
            const stratumId = constraint.strata;
            const stratumIdIndex = stratumIds.indexOf(stratumId);

            // Push this constraint under the stratum's array of constraints
            let stratumConstraintsArray: Constraint.Constraint[];
            if (stratumIdIndex < 0) {
                stratumConstraintsArray = [];
                stratumGroupedConstraints.push(stratumConstraintsArray);
                stratumIds.push(stratumId);

                // Additionally pop a custom _id property on the array as a key
                (stratumConstraintsArray as any)._id = stratumId;
            } else {
                stratumConstraintsArray = stratumGroupedConstraints[stratumIdIndex];
            }

            stratumConstraintsArray.push(constraint);
        });


        return stratumGroupedConstraints;
    }




    addNewGroupConstraints() {
        // Add new constraint in next stratum without constraints
        const stratum = this.strataWithoutConstraints[0];

        // TODO: Generate random constraint?
        const constraint: Constraint.Constraint = {
            _id: performance.now(),
            strata: this.strata.findIndex(s => s._id === stratum._id),
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
#constraint-groups {
    background: rgba(0, 0, 0, 0.05);

    display: flex;
    flex-direction: column;
}

.constraint-group {
    margin: 0.5em;
}
</style>
