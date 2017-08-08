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
                <div class="no-constraints-msg"
                     v-if="stratumConstraints.length === 0">
                    <i>Set constraints for {{ stratum.label }}s by clicking on the Add button below.</i>
                </div>
                <ul>
                    <li class="constraint"
                        v-for="constraint in stratumConstraints"
                        :key="constraint._id">
                        <ConstraintsEditorConstraintItem :stratum="stratum"
                                                         :constraint="constraint"></ConstraintsEditorConstraintItem>
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
import { Vue, Component, Mixin, Prop, p } from "av-ts";

import ConstraintsEditorConstraintItem from "./ConstraintsEditorConstraintItem.vue";

import { Data as IStratum } from "../data/Stratum";
import { Constraint, Data as IConstraint, CountFilter as IConstraint_CountFilter, CountCondition as IConstraint_CountCondition } from "../data/Constraint";
import { ColumnData } from "../data/ColumnData";

import { StoreState } from "./StoreState";

@Component({
    components: {
        ConstraintsEditorConstraintItem: ConstraintsEditorConstraintItem as Vue.Component,
    },
})
export default class ConstraintsEditorStratum extends Mixin(StoreState) {
    // Props
    @Prop stratum = p<IStratum>({ required: true, }) as any;
    @Prop stratumConstraints = p<ReadonlyArray<IConstraint>>({ type: Array, required: true, });
    @Prop isPartition = p({ type: Boolean, required: false, default: false, });

    async addNewConstraint() {
        const columnData = this.state.recordData.columns;

        // Pick random column and random default value
        const defaultColumnIndex = (Math.random() * columnData.length) >>> 0;
        const defaultColumnData = columnData[defaultColumnIndex];

        const valueSetArray = Array.from(ColumnData.GetValueSet(defaultColumnData) as Set<string | number>);
        let defaultFilterValue = valueSetArray[(Math.random() * valueSetArray.length) >>> 0];

        // Ensure that the default filter value is of the appropriate type
        switch (defaultColumnData.type) {
            case "number": {
                defaultFilterValue = +defaultFilterValue || 0;
                break;
            }
            case "string": {
                defaultFilterValue = "" + defaultFilterValue;
                break;
            }
            default: {
                throw new Error("Unknown column type");
            }
        }

        const constraintType = "count";
        const constraintWeight = 50;    // "should have"
        const constraintStratum = this.stratum._id; // Stratum object ID
        const constraintFilter: IConstraint_CountFilter = {
            column: ColumnData.ConvertToMinimalDescriptor(defaultColumnData),
            function: "eq",
            values: [
                defaultFilterValue,
            ],
        };
        const constraintCondition: IConstraint_CountCondition = {
            function: "eq",
            value: 1,
        };

        const newConstraint = Constraint.Init(constraintType, constraintWeight, constraintStratum, constraintFilter, constraintCondition);

        await this.$store.dispatch("upsertConstraint", newConstraint);
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
    display: flex;
    flex-direction: row;

    justify-content: flex-start;
    align-items: flex-start;

    margin-left: 1.5rem;
}

.stratum-constraints>div {
    flex-grow: 1;
    margin: 1rem;
}

.stratum-constraints ul {
    margin: 0 -1rem;
    padding: 0;
    list-style: none;
}

.stratum-constraints li+li {
    margin-top: 1rem;
}

.stratum-constraints .constraint {
    padding-left: 0.8rem;
    font-size: 1.4em;

    z-index: 1;

    background: rgba(0, 0, 0, 0.05);
    background-clip: content-box;
}

.stratum-constraints .constraint::before {
    content: "";
    position: absolute;
    display: inline-block;

    width: 1rem;
    height: 1rem;

    border-radius: 50%;
    background: #49075E;

    margin-top: 0.5em;
    margin-left: -1.7rem;
}

button.add-constraint {
    display: inline-flex;

    width: 2.5rem;
    height: 2.5rem;

    border-radius: 50%;

    justify-content: center;
    align-items: center;

    position: relative;
    left: -1.6rem;
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

.no-constraints-msg {
    margin-bottom: 1rem;
}
</style>
