<template>
    <div>
        <div class="stratum-each-heading">
            Each
            <span class="stratum-label">{{ stratum.label }}</span>
        </div>
        <br>
        <div v-if="!isPartition"
             class="stratum-constraints">
            <div>
                <ul>
                    <li class="constraint"
                        v-for="constraint in stratumConstraints"
                        :key="constraint._id">
                        <ConstraintsEditorConstraintItem :constraint="constraint"></ConstraintsEditorConstraintItem>
                    </li>
                    <li>
                        <button class="button add-constraint"
                                @click="addNewConstraint">
                            <span>Add {{ stratum.label }} constraint</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
        <div v-else
             class="stratum-constraints">
            <div>
                <i>Constraints are not applicable to partitions.</i>
            </div>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import ConstraintsEditorConstraintItem from "./ConstraintsEditorConstraintItem.vue";
import * as Stratum from "../data/Stratum";
import * as Constraint from "../data/Constraint";

@Component({
    components: {
        ConstraintsEditorConstraintItem,
    },
})
export default class ConstraintsEditorStratum extends Vue {
    // Props
    @Prop stratum: Stratum.Stratum = p({ type: Object, required: true, }) as any;
    @Prop stratumConstraints: ReadonlyArray<Constraint.Constraint> = p({ type: Array, required: true, }) as any;
    @Prop isPartition: boolean = p({ type: Boolean, required: false, default: false, }) as any;

    get strata() {
        return this.$store.state.constraintsConfig.strata as ReadonlyArray<Stratum.Stratum>;
    }

    get stratumIndex() {
        const id = this.stratum._id;
        return this.strata.findIndex(s => s._id === id);
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
.stratum-each-heading {
    display: inline-block;

    font-size: 1.5em;
    color: #fff;

    background: #608;

    border-radius: 0.3em;
    padding-left: 0.7em;
}

.stratum-label {
    display: inline-block;
    background: #49075E;
    padding: 0.3em 0.7em;
    border-radius: 0.3em;

    color: #fff;
}

.stratum-constraints {
    display: inline-flex;
    flex-direction: row;

    justify-content: flex-start;
    align-items: flex-start;

    margin-left: 1.5em;
}

.stratum-constraints>div {
    flex-grow: 1;
    /*flex-shrink: 0;*/
    margin: 1rem;
}

.stratum-constraints ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

.stratum-constraints .constraint {
    font-size: 1.4em;
    background: rgba(0, 0, 0, 0.05);
}

.stratum-constraints .constraint+.constraint {
    margin-top: 0.5em;
}

button.add-constraint {
    display: inline-flex;
    margin-top: 1em;

    width: 3em;
    height: 3em;

    border-radius: 50%;

    justify-content: center;
    align-items: center;

    position: relative;
}

button.add-constraint>span {
    display: none;

    min-width: 10em;

    position: absolute;
    left: 3.7em;
    color: #777;

    text-align: left;
}

button.add-constraint::before {
    display: block;
    content: "+";

    line-height: 0;

    font-size: 3em;
    font-weight: 100;

    margin-top: -0.05em;
}

button.add-constraint:hover>span,
button.add-constraint:focus>span,
button.add-constraint:active>span {
    display: block;
}
</style>
