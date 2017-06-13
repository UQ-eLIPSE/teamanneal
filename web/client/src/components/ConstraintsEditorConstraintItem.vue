<template>
    <div id="constraint-item">
        <DynamicWidthSelect class="select cost-weight" :list="costWeightList" :selectedIndex="selectedCostWeightIndex" @change="onCostWeightChange" />
        <DynamicWidthSelect class="select condition-function" :list="conditionFunctionList" :selectedIndex="selectedConditionFunctionIndex" @change="onConditionFunctionChange" />
        <DynamicWidthInputField class="input condition-count" v-if="showConditionCount" :val="''+p_conditionCount" @change="onConditionCountChange" />
        <DynamicWidthSelect class="select filter-column" :list="columnInfoList" :selectedIndex="p_filterColumn" @change="onFilterColumnChange" />
        <DynamicWidthSelect class="select filter-function" v-if="showFilterFunction" :list="filterFunctionList" :selectedIndex="selectedFilterFunctionIndex" @change="onFilterFunctionChange" />
        <DynamicWidthInputField class="input filter-value" v-if="showFilterValueAsInput" :val="''+p_filterValue" @change="onFilterValueAsInputChange" />
        <DynamicWidthSelect class="select filter-value" v-if="showFilterValueAsSelect" :list="filterValueAsSelectList" :selectedIndex="selectedFilterValueAsSelectIndex" @change="onFilterValueAsSelectChange" />
        <button @click="deleteConstraint">Delete</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Watch, Prop, p } from "av-ts";

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
        text: "greater than",
    },
    {
        value: "lt",
        text: "fewer than",
    },
    {
        value: "low",
        text: "as few of",
    },
    {
        value: "high",
        text: "as many of",
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
    @Prop constraint: Constraint.Constraint = p(Object) as any;

    // Private
    p_costWeight: number | undefined = 0;
    p_conditionFunction: string | undefined = "";
    p_conditionCount: number | undefined = 0;
    p_filterColumn: number | undefined = 0;
    p_filterFunction: string | undefined = "";
    p_filterValue: number | string | undefined = "";


    get costWeightList() {
        return CostWeightList;
    }

    get conditionFunctionList() {
        return ConditionFunctionList;
    }

    get filterFunctionList() {
        switch (this.thisConstraintColumnInfo.type) {
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




    get thisConstraintId() {
        return this.constraint._id;
    }

    get thisConstraintType() {
        switch (this.p_conditionFunction) {
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

    get thisConstraintColumnInfo() {
        return this.columnInfo[this.p_filterColumn!];
    }

    get thisConstraintFilter() {
        switch (this.thisConstraintType) {
            case "count":
            case "limit":
                return {
                    column: this.p_filterColumn!,
                    function: this.p_filterFunction!,
                    values: [this.p_filterValue!],
                }

            case "similarity":
                return {
                    column: this.p_filterColumn!,
                }
        }

        throw new Error("Unknown constraint type");
    }

    get thisConstraintCondition() {
        switch (this.thisConstraintType) {
            case "count":
                return {
                    function: this.p_conditionFunction! as any,
                    value: this.p_conditionCount!,
                }
            case "limit":
                return {
                    function: this.p_conditionFunction! as any,
                }

            case "similarity":
                return {
                    function: this.p_conditionFunction! as any,
                }
        }

        throw new Error("Unknown constraint type");
    }

    get selectedCostWeightIndex() {
        const value = this.p_costWeight;
        const index = CostWeightList.findIndex(option => option.value === value);

        if (index < 0) {
            return 0;
        }

        return index;
    }

    get selectedConditionFunctionIndex() {
        const value = this.p_conditionFunction;
        const index = ConditionFunctionList.findIndex(option => option.value === value);

        if (index < 0) {
            return 0;
        }

        return index;
    }

    get selectedFilterFunctionIndex() {
        const value = this.p_filterFunction;
        const index = this.filterFunctionList.findIndex(option => option.value === value);

        if (index < 0) {
            return 0;
        }

        return index;
    }

    get selectedFilterValueAsSelectIndex() {
        const value = this.p_filterValue;
        const index = this.filterValueAsSelectList.findIndex(option => option.value === value);

        if (index < 0) {
            return 0;
        }

        return index;
    }

    get filterValueAsSelectList() {
        const filterColumnIndex = this.p_filterColumn!;
        return Array.from(this.columnInfo[filterColumnIndex].valueSet as any as ArrayLike<number | string>)
            .sort()
            .map(value => ({
                value,
                text: value,
            }));
    }




    get showConditionCount() {
        switch (this.p_conditionFunction) {
            case "low":
            case "high":
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    get showFilterFunction() {
        switch (this.p_conditionFunction) {
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    get showFilterValueAsInput() {
        return this.showFilterFunction && this.thisConstraintColumnInfo.type === "number";
    }

    get showFilterValueAsSelect() {
        return this.showFilterFunction && this.thisConstraintColumnInfo.type === "string";
    }




    onCostWeightChange(option: any) {
        this.p_costWeight = option.value;
        this.saveConstraint();
    }

    onConditionFunctionChange(option: any) {
        this.p_conditionFunction = option.value;
        this.saveConstraint();
    }

    onConditionCountChange(newConditionCount: string) {
        this.p_conditionCount = +newConditionCount || 0;
        this.saveConstraint();
    }

    onFilterColumnChange(option: any) {
        this.p_filterColumn = this.columnInfo.indexOf(option.value);
        this.saveConstraint();
    }

    onFilterFunctionChange(option: any) {
        this.p_filterFunction = option.value;
        this.saveConstraint();
    }

    onFilterValueAsInputChange(newFilterValue: string) {
        this.p_filterValue = this.sanitiseFilterValue(newFilterValue);
        this.saveConstraint();
    }

    onFilterValueAsSelectChange(option: any) {
        this.p_filterValue = option.value;
        this.saveConstraint();
    }

    @Watch("p_filterColumn")
    updateFilterValueOnFilterColumnChange() {
        this.p_filterValue = this.sanitiseFilterValue(this.p_filterValue!);
    }

    sanitiseFilterValue(filterValue: number | string) {
        switch (this.thisConstraintColumnInfo.type) {
            case "number":
                return +filterValue || 0;

            case "string":
                return "" + filterValue;
        }

        throw new Error("Unknown column type");
    }


    deleteConstraint() {
        this.$store.commit("deleteConstraintsConfigConstraintOf", this.thisConstraintId);
    }

    saveConstraint() {
        // Shallow copy constraint
        const newConstraint = { ...(this.constraint) };

        // Write new values in
        newConstraint.weight = this.p_costWeight!;
        newConstraint.type = this.thisConstraintType;
        newConstraint.filter = this.thisConstraintFilter;
        newConstraint.condition = this.thisConstraintCondition;

        // Commit update
        const constraintUpdate: Constraint.Update = {
            constraint: newConstraint,
        }

        this.$store.commit("updateConstraintsConfigConstraint", constraintUpdate);
    }

    transferPropsToData() {
        const constraint = this.constraint;

        this.p_costWeight = constraint.weight;
        this.p_conditionFunction = constraint.condition.function;
        this.p_conditionCount = (constraint.condition as any).value;
        this.p_filterColumn = constraint.filter.column;
        this.p_filterFunction = (constraint.filter as any).function;
        this.p_filterValue = this.sanitiseFilterValue(((constraint.filter as any).values || [])[0]);  // NOTE: Values is an array, but we only support single values for now
    }

    @Lifecycle created() {
        this.transferPropsToData();
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
</style>
