<template>
    <div class="constraint-item">
        <div class="constraint-content">
            <DynamicWidthSelect class="select cost-weight"
                                v-model="constraintCostWeight"
                                :list="costWeightList"></DynamicWidthSelect>
    
            <span v-if="!personUnitNounFollowsCondition"
                  class="person-unit-noun-fragment">{{ personUnitNoun }} with</span>
    
            <DynamicWidthSelect class="select condition-function"
                                v-model="constraintConditionFunction"
                                :list="conditionFunctionList"></DynamicWidthSelect>
    
            <DynamicWidthInputField class="input condition-count"
                                    v-if="showConditionCount"
                                    v-model="constraintConditionCount"></DynamicWidthInputField>
    
            <span v-if="personUnitNounFollowsCondition"
                  class="person-unit-noun-fragment">{{ personUnitNoun }} with</span>
    
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
    
            <span class="group-size-applicability-condition-fragment"
                  :class="groupSizeApplicabilityConditionFragmentClasses">when {{ stratum.label }} has
                <u>any number of</u> people</span>
        </div>
        <div class="action-buttons">
            <button class="button delete"
                    title="Delete constraint"
                    @click="deleteConstraint">
                <span>Delete</span>
            </button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { deepCopy, deepMerge } from "../util/Object";

import * as Stratum from "../data/Stratum";
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
    @Prop stratum: Stratum.Stratum = p({ type: Object, required: true, }) as any;
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




    get thisConstraintId() {
        return this.constraint._id;
    }

    get thisConstraintType() {
        switch (this.constraintConditionFunction) {
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

    get isGroupSizeSpecified() {
        return this.constraint.applicability.some(condition => condition.type === "group-size");
    }

    get groupSizeApplicabilityConditionFragmentClasses() {
        return {
            'group-size-specified': this.isGroupSizeSpecified,
        }
    }





    sanitiseFilterValue(filterValue: number | string) {
        switch (this.constraintFilterColumnInfo.type) {
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
            condition: {
                function: newValue,
            },
        });
    }

    get constraintConditionCount() {
        return (this.constraint.condition as any).value;
    }

    set constraintConditionCount(newValue: any) {
        // Must be a uint32 number
        const conditionCount = (+newValue || 0) >>> 0;
        this.updateConstraint({
            condition: {
                value: conditionCount,
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
        const filterValue: string | number = this.sanitiseFilterValue(((this.constraint.filter as any).values || [])[0]);

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

    color: inherit;

    cursor: pointer;
}

.constraint-item {
    display: flex;
    flex-direction: row;

    padding: 0;
    margin: 0;
    color: #49075E;
}

.constraint-item>div {
    padding: 0.2em 0.3em;
}

.constraint-item>div+div {
    padding-left: 0;
}

.constraint-item>.constraint-content {
    flex-grow: 1;
}

.constraint-item>.action-buttons {
    flex-shrink: 0;

    font-size: 0.7em;

    display: flex;
    flex-direction: column;

    justify-content: center;
    align-items: center;
}

.person-unit-noun-fragment {
    display: inline-block;
}

button.delete {
    display: inline-flex;
    border: 0;
    margin: 0;
    padding: 0;

    width: 1.5em;
    height: 1.5em;

    background: transparent;

    border-radius: 50%;

    justify-content: center;
    align-items: center;

    position: relative;
}

button.delete>span {
    position: absolute;
    font-size: 0;
    width: 0;
    height: 0;
    overflow: hidden;
}

button.delete::before {
    display: block;
    content: "";

    width: 1.3em;
    height: 1.3em;

    /* 
     * "Trash" by Gregor Cresnar, "Pixel Perfect Collection" 
     * https://thenounproject.com/grega.cresnar/collection/pixel-perfect/?q=trash&i=976401
     * License: CC BY 3.0 US
     */
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMjAwJyBoZWlnaHQ9JzIwMCcgZmlsbD0iIzk5OTk5OSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkYXRhLW5hbWU9IkxheWVyIDEiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB4PSIwcHgiIHk9IjBweCI+PHRpdGxlPjFBcnRib2FyZCAyMTwvdGl0bGU+PHBhdGggZD0iTTU4LDIwdjZINzRhMiwyLDAsMCwxLDIsMnY0YTIsMiwwLDAsMS0yLDJIMjZhMiwyLDAsMCwxLTItMlYyOGEyLDIsMCwwLDEsMi0ySDQyVjIwYTIsMiwwLDAsMSwyLTJINTZBMiwyLDAsMCwxLDU4LDIwWk0zNCw4Mkg2NmE2LDYsMCwwLDAsNi02VjQwSDI4Vjc2QTYsNiwwLDAsMCwzNCw4MloiLz48L3N2Zz4=");
    background-repeat: no-repeat;
    background-size: cover;
}

button.delete:hover,
button.delete:focus,
button.delete:active {
    background-color: #8b0000;
}

button.delete:hover::before,
button.delete:focus::before,
button.delete:active::before {
    /* 
     * "Trash" by Gregor Cresnar, "Pixel Perfect Collection"
     * https://thenounproject.com/grega.cresnar/collection/pixel-perfect/?q=trash&i=976401
     * License: CC BY 3.0 US
     */
    background-image: url("data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48dGl0bGU+MUFydGJvYXJkIDIxPC90aXRsZT48cGF0aCBkPSJNNTgsMjB2Nkg3NGEyLDIsMCwwLDEsMiwydjRhMiwyLDAsMCwxLTIsMkgyNmEyLDIsMCwwLDEtMi0yVjI4YTIsMiwwLDAsMSwyLTJINDJWMjBhMiwyLDAsMCwxLDItMkg1NkEyLDIsMCwwLDEsNTgsMjBaTTM0LDgySDY2YTYsNiwwLDAsMCw2LTZWNDBIMjhWNzZBNiw2LDAsMCwwLDM0LDgyWiIvPjwvc3ZnPg==");
}

.group-size-applicability-condition-fragment {
    opacity: 0.5;
    font-style: italic;
}

.group-size-applicability-condition-fragment.group-size-specified {
    opacity: 1;
    font-style: inherit;
}
</style>
