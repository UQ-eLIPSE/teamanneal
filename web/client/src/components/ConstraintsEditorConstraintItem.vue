<template>
    <div id="constraint-item">
        <DynamicWidthSelect class="select cost-weight" :list="costWeightList" :selectedIndex="selectedCostWeightIndex" @change="onCostWeightChange" />
        <DynamicWidthSelect class="select condition-function" :list="conditionFunctionList" :selectedIndex="selectedConditionFunctionIndex" @change="onConditionFunctionChange" />
        <DynamicWidthInputField class="input condition-count" v-if="showConditionCount" :val="''+p_conditionCount" @change="onConditionCountChange" />
        <DynamicWidthSelect class="select column" :list="columns" @change="onColumnChange" />
        <DynamicWidthSelect class="select filter-function" v-if="showFilterFunction" :list="filterFunctionList" :selectedIndex="selectedFilterFunctionIndex" @change="onFilterFunctionChange" />
        <DynamicWidthInputField class="input filter-value" v-if="showFilterValue" :val="''+p_filterValue" @change="onFilterValueChange" />
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

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

const FilterFunctionList = [
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
        text: "no fewer than",
    },
    {
        value: "lt",
        text: "no more than",
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
        text: "as similar values as possible of",
    },
    {
        value: "different",
        text: "as different values as possible of",
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
    columns = [
        {
            value: "1",
            text: "col1",
        },
        {
            value: "2",
            text: "col2",
        },
    ]



    // Private
    p_costWeight: number = 0;
    p_conditionFunction: string = "";
    p_conditionCount: number = 0;
    p_column: string = "";
    p_filterFunction: string = "";
    p_filterValue: string = "";     // Can be processed either as a string or number depending on the type of the column


    get costWeightList() {
        return CostWeightList;
    }

    get conditionFunctionList() {
        return ConditionFunctionList;
    }

    get filterFunctionList() {
        return FilterFunctionList;
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
        const index = FilterFunctionList.findIndex(option => option.value === value);

        if (index < 0) {
            return 0;
        }

        return index;
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

    get showFilterValue() {
        return this.showFilterFunction;
    }





    onCostWeightChange(option: any) {
        this.p_costWeight = option.value;
    }

    onConditionFunctionChange(option: any) {
        this.p_conditionFunction = option.value;
    }

    onConditionCountChange(newConditionCount: string) {
        this.p_conditionCount = +newConditionCount || 0;
    }

    onColumnChange(option: any) {
        this.p_column = option.value;
    }

    onFilterFunctionChange(option: any) {
        this.p_filterFunction = option.value;
    }

    onFilterValueChange(newFilterValue: string) {
        this.p_filterValue = newFilterValue;
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
