<template>
    <div id="constraint-item">
        <DynamicWidthSelect class="select cost-weight"
                            v-model="constraintCostWeight"
                            :list="costWeightList"></DynamicWidthSelect>
    
        <span v-if="!personUnitNounFollowsCondition"
              class="personUnitNounFragment">{{ personUnitNoun }} with</span>
    
        <DynamicWidthSelect class="select condition-function"
                            v-model="constraintConditionFunction"
                            :list="conditionFunctionList"></DynamicWidthSelect>
    
        <DynamicWidthInputField class="input condition-count"
                                v-if="showConditionCount"
                                v-model="constraintConditionCount"></DynamicWidthInputField>
    
        <span v-if="personUnitNounFollowsCondition"
              class="personUnitNounFragment">{{ personUnitNoun }} with</span>
    
        <DynamicWidthSelect class="select filter-column"
                            v-model="constraintFilterColumnInfo"
                            :list="columnInfoList"></DynamicWidthSelect>
    
        <DynamicWidthSelect class="select filter-function"
                            v-if="showFilterFunction"
                            v-model="constraintFilterFunction"
                            :list="filterFunctionList"></DynamicWidthSelect>
    
        <DynamicWidthInputField class="input filter-value"
                                v-if="showFilterValueAsInput"
                                v-model="constraintFilterValues"></DynamicWidthInputField>
    
        <DynamicWidthSelect class="select filter-value"
                            v-if="showFilterValueAsSelect"
                            v-model="constraintFilterValues"
                            :list="filterValueAsSelectList"></DynamicWidthSelect>
    
        <button @click="deleteConstraint">Delete</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { parse, parseUint32 } from "../util/Number";
import { deepCopy, deepMerge } from "../util/Object";

import * as Constraint from "../data/Constraint";
import * as ColumnInfo from "../data/ColumnInfo";

import DynamicWidthSelect from "./DynamicWidthSelect.vue";
import DynamicWidthInputField from "./DynamicWidthInputField.vue";

/*
 * Sentence structure
 * 
 * <weight>      <condition>                                  <filter>
 * -----------------------------------------------------------------------------
 * [must have]   [at least] _n_                      [column] [equal to] _x_
 * [should have] [as many of]                        [column] [not equal to] _x_
 * [may have]    [as similar values as possible for] [column]
 */

const NumberFilterFunctionList = [
    {
        value: "eq",
        text: "equal to",
    },
    {
        value: "neq",
        text: "not equal to",
    },
    {
        value: "lt",
        text: "less than",
    },
    {
        value: "lte",
        text: "less than or equal to",
    },
    {
        value: "gt",
        text: "greater than",
    },
    {
        value: "gte",
        text: "greater than or equal to",
    },
];

const StringFilterFunctionList = [
    {
        value: "eq",
        text: "equal to",
    },
    {
        value: "neq",
        text: "not equal to",
    },
];

const ConditionFunctionList = [
    {
        value: "eq",
        text: "exactly",
    },
    {
        value: "neq",
        text: "not exactly",
    },
    {
        value: "gte",
        text: "at least",
    },
    {
        value: "lte",
        text: "at most",
    },
    {
        value: "gt",
        text: "more than",
    },
    {
        value: "lt",
        text: "fewer than",
    },
    {
        value: "low",
        text: "as few",
    },
    {
        value: "high",
        text: "as many",
    },
    {
        value: "similar",
        text: "similar values of",
    },
    {
        value: "different",
        text: "different values of",
    },
];

const CostWeightList = [
    {
        value: 2,
        text: "may have",
    },
    {
        value: 10,
        text: "could have",
    },
    {
        value: 50,
        text: "should have",
    },
    {
        value: 1000,
        text: "must have",
    },
];


@Component({
    components: {
        DynamicWidthSelect,
        DynamicWidthInputField,
    },
})
export default class ConstraintsEditorConstraintItem extends Vue {
    // Props
    @Prop constraint: Constraint.Constraint = p({ type: Object, required: true, }) as any;

    get costWeightList() {
        return CostWeightList;
    }

    get conditionFunctionList() {
        return ConditionFunctionList;
    }

    get filterFunctionList() {
        switch (this.constraintFilterColumnInfo.type) {
            case "number":
                return NumberFilterFunctionList;
            case "string":
                return StringFilterFunctionList;
        }

        throw new Error("Unknown column type");
    }

    get columnInfo() {
        return this.$store.state.sourceFile.columnInfo as ColumnInfo.ColumnInfo[];
    }

    get columnInfoList() {
        return this.columnInfo.map(columnInfo => ({
            value: columnInfo,
            text: columnInfo.label,
        }));
    }




    getConstraintType(conditionFunction: string) {
        switch (conditionFunction) {
            case "eq":
            case "neq":
            case "gte":
            case "lte":
            case "gt":
            case "lt":
                return "count";

            case "low":
            case "high":
                return "limit";

            case "similar":
            case "different":
                return "similarity";
        }

        throw new Error("Unknown constraint type");
    }





    get thisConstraintId() {
        return this.constraint._id;
    }

    get thisConstraintType() {
        return this.getConstraintType(this.constraintConditionFunction);
    }

    get thisConstraintFilter() {
        switch (this.thisConstraintType) {
            case "count":
            case "limit":
                return {
                    column: this.constraintFilterColumnInfo!,
                    function: this.constraintFilterFunction!,
                    values: [this.constraintFilterValues!],
                }

            case "similarity":
                return {
                    column: this.constraintFilterColumnInfo!,
                }
        }

        throw new Error("Unknown constraint type");
    }

    get thisConstraintCondition() {
        switch (this.thisConstraintType) {
            case "count":
                return {
                    function: this.constraintConditionFunction! as any,
                    value: this.constraintConditionCount!,
                }
            case "limit":
                return {
                    function: this.constraintConditionFunction! as any,
                }

            case "similarity":
                return {
                    function: this.constraintConditionFunction! as any,
                }
        }

        throw new Error("Unknown constraint type");
    }



    get filterValueAsSelectList() {
        return Array.from(this.constraintFilterColumnInfo.valueSet as any as ArrayLike<number | string>)
            .sort()
            .map(value => ({
                value,
                text: value,
            }));
    }




    get showConditionCount() {
        switch (this.constraintConditionFunction) {
            case "low":
            case "high":
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    get showFilterFunction() {
        switch (this.constraintConditionFunction) {
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    get showFilterValueAsInput() {
        return (
            this.showFilterFunction &&
            this.constraintFilterColumnInfo.type === "number"
        );
    }

    get showFilterValueAsSelect() {
        return (
            this.showFilterFunction &&
            this.constraintFilterColumnInfo.type === "string"
        );
    }

    /**
     * Generates the appropriate (pluralised) noun for the constraints editor
     * sentence
     */
    get personUnitNoun() {
        // If the count is exactly one, return "person"
        if (this.showConditionCount && this.constraintConditionCount === 1) {
            return "person";
        } else {
            return "people";
        }
    }

    /**
     * Determines if the person unit noun ("person" or "people") comes after
     * the condition function selection menu in the constraints editor sentence
     */
    get personUnitNounFollowsCondition() {
        switch (this.constraintConditionFunction) {
            case "similar":
            case "different":
                return false;
        }

        return true;
    }





    sanitiseFilterValue(filterValue: number | string) {
        switch (this.constraintFilterColumnInfo.type) {
            case "number":
                return parse(filterValue, +this.constraintFilterValues);

            case "string":
                return "" + filterValue;
        }

        throw new Error("Unknown column type");
    }

    deleteConstraint() {
        this.$store.commit("deleteConstraintsConfigConstraintOf", this.thisConstraintId);
    }

    updateConstraint(diff: any) {
        // Deep copy and merge in diff
        const newConstraint = deepMerge(deepCopy(this.constraint), diff);

        // Commit update
        const constraintUpdate: Constraint.Update = {
            constraint: newConstraint,
        }

        this.$store.commit("updateConstraintsConfigConstraint", constraintUpdate);
    }

    get constraintCostWeight() {
        return this.constraint.weight;
    }

    set constraintCostWeight(newValue: number) {
        this.updateConstraint({
            weight: newValue,
        });
    }

    get constraintConditionFunction() {
        return this.constraint.condition.function;
    }

    set constraintConditionFunction(newValue: string) {
        this.updateConstraint({
            type: this.getConstraintType(newValue),
            condition: {
                function: newValue,
            },
        });
    }

    get constraintConditionCount() {
        return (this.constraint.condition as any).value;
    }

    set constraintConditionCount(newValue: any) {
        this.updateConstraint({
            condition: {
                value: parseUint32(newValue, this.constraintConditionCount),
            },
        });
    }

    get constraintFilterColumnInfo() {
        return this.columnInfo[this.constraint.filter.column];
    }

    set constraintFilterColumnInfo(newValue: ColumnInfo.ColumnInfo) {
        const columnIndex = this.columnInfo.indexOf(newValue);
        this.updateConstraint({
            filter: {
                column: columnIndex,
            },
        });
    }

    get constraintFilterFunction() {
        const filterFunction: string = (this.constraint.filter as any).function;

        // If the filter function value does not exist within the list, then
        // set the filter function value to the first available option
        if (this.filterFunctionList.findIndex(item => item.value === filterFunction) < 0) {
            this.constraintFilterFunction = this.filterFunctionList[0].value;
        }

        return filterFunction;
    }

    set constraintFilterFunction(newValue: string) {
        this.updateConstraint({
            filter: {
                function: newValue,
            },
        });
    }

    get constraintFilterValues() {
        // NOTE: Values is an array, but we only support single values for now
        const filterValue: string | number = ((this.constraint.filter as any).values || [])[0];

        // If the filter value is determined by a select list and the filter
        // value does not exist within the list, then set the filter value to
        // the first available option
        if (this.showFilterValueAsSelect &&
            this.filterValueAsSelectList.findIndex(item => item.value === filterValue) < 0) {
            this.constraintFilterValues = this.filterValueAsSelectList[0].value;
        }

        return filterValue;
    }

    set constraintFilterValues(newValue: string | number) {
        // NOTE: Values is an array, but we only support single values for now
        this.updateConstraint({
            filter: {
                values: [
                    this.sanitiseFilterValue(newValue),
                ],
            },
        });
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.select,
.input {
    background: none;

    border: 0;
    border-bottom: 1px dotted;

    color: #49075E;

    cursor: pointer;
}

#constraint-item {
    padding: 0.2em 0.3em;
    margin: 0.2em 0;
    background: rgba(0, 0, 0, 0.05);
}

.personUnitNounFragment {
    display: inline-block;
    color: #49075E;
}
</style>
