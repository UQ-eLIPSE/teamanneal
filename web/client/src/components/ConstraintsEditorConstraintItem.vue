<template>
    <div class="constraint-item">
        <div class="constraint-content">
            <DynamicWidthSelect class="select"
                                v-model="constraintCostWeight"
                                :list="costWeightList"></DynamicWidthSelect>

            <span v-if="!personUnitNounFollowsCondition"
                  class="person-unit-noun-fragment">{{ personUnitNoun }} with</span>

            <DynamicWidthSelect class="select"
                                v-model="constraintConditionFunction"
                                :list="conditionFunctionList"></DynamicWidthSelect>

            <DynamicWidthInputField class="input"
                                    v-if="showConditionCount"
                                    v-model="constraintConditionCount"></DynamicWidthInputField>

            <span v-if="personUnitNounFollowsCondition"
                  class="person-unit-noun-fragment">{{ personUnitNoun }} with</span>

            <DynamicWidthSelect class="select"
                                v-model="constraintFilterColumnData"
                                :list="columnDataList"></DynamicWidthSelect>

            <DynamicWidthSelect class="select"
                                v-if="showFilterFunction"
                                v-model="constraintFilterFunction"
                                :list="filterFunctionList"></DynamicWidthSelect>

            <DynamicWidthInputField class="input"
                                    v-if="showFilterValueAsInput"
                                    v-model="constraintFilterValues"></DynamicWidthInputField>

            <DynamicWidthSelect class="select"
                                v-if="showFilterValueAsSelect"
                                v-model="constraintFilterValues"
                                :list="filterValueAsSelectList"></DynamicWidthSelect>

            <span>when {{ stratum.label }} has
                <DynamicWidthSelect class="select"
                                    v-model="groupSizeApplicabilityConditionValue"
                                    :list="groupSizeApplicabilityConditionList"
                                    :minWidth="1"></DynamicWidthSelect>
                {{ groupSizeApplicabilityConditionPersonUnitNoun }}</span>
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

import { parse, parseUint32 } from "../util/Number";
import { deepCopy, deepMerge } from "../util/Object";

import { Stratum } from "../data/Stratum";
import {
    Data as IConstraint,
    ApplicabilityGroupSizeCondition as IConstraint_ApplicabilityGroupSizeCondition,
    Count as IConstraint_Count,
    Limit as IConstraint_Limit,
    ConstraintPhraseMaps
} from "../data/Constraint";
import { ColumnData, Data as IColumnData } from "../data/ColumnData";
import { DeepPartial } from "../data/DeepPartial";

import { AnnealCreator as S } from "../store";

import DynamicWidthSelect from "./DynamicWidthSelect.vue";
import DynamicWidthInputField from "./DynamicWidthInputField.vue";


/*
 * Example sentence structures
 * 
 * Type       | <weight>      <condition>                       <filter>                        <applicability condition>
 * ------------------------------------------------------------------------------------------------------
 * count      | [must have]   [at least] _n_ people with        [column] [equal to] _x_         when <group> has [any number of people]
 * limit      | [should have] [as many] people with             [column] [not equal to] _x_     when <group> has [5 people]
 * similarity | [may have]    people with [similar values of]   [column]                        when <group> has [2 people]
 */

@Component({
    components: {
        DynamicWidthSelect,
        DynamicWidthInputField,
    },
})
export default class ConstraintsEditorConstraintItem extends Vue {
    // Props
    @Prop stratum = p<Stratum>({ required: true, });
    @Prop constraint = p<IConstraint>({ required: true, });
    @Prop groupSizes = p<ReadonlyArray<number>>({ type: Array, required: true, });

    // Private
    groupSizeApplicabilityConditionPopoverVisible: boolean = false;

    get costWeightList() {
        return ConstraintPhraseMaps.CostWeightList;
    }

    get conditionFunctionList() {
        return ConstraintPhraseMaps.ConditionFunctionList;
    }

    get filterFunctionList() {
        switch (this.constraintFilterColumnData.type) {
            case "number":
                return ConstraintPhraseMaps.NumberFilterFunctionList;
            case "string":
                return ConstraintPhraseMaps.StringFilterFunctionList;
        }

        throw new Error("Unknown column type");
    }

    get groupSizeApplicabilityConditionList() {
        const list: { value: number | undefined, text: string }[] =
            this.groupSizes.map((size) => ({
                value: size,
                text: "" + size,
            }));

        list.unshift({
            value: undefined,
            text: "any number of",
        });

        return list;
    }

    get columnData() {
        return S.state.recordData.columns;
    }

    get columnDataList() {
        return this.columnData.map(columnData => ({
            value: columnData,
            text: columnData.label,
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





    get thisConstraintType() {
        return this.getConstraintType(this.constraintConditionFunction);
    }

    get thisConstraintFilter() {
        switch (this.thisConstraintType) {
            case "count":
            case "limit":
                return {
                    column: this.constraintFilterColumnData!,
                    function: this.constraintFilterFunction!,
                    values: [this.constraintFilterValues!],
                }

            case "similarity":
                return {
                    column: this.constraintFilterColumnData!,
                }
        }

        throw new Error("Unknown constraint type");
    }

    get thisConstraintCondition() {
        switch (this.thisConstraintType) {
            case "count":
                return {
                    function: this.constraintConditionFunction,
                    value: this.constraintConditionCount!,
                }
            case "limit":
                return {
                    function: this.constraintConditionFunction,
                }

            case "similarity":
                return {
                    function: this.constraintConditionFunction,
                }
        }

        throw new Error("Unknown constraint type");
    }



    get filterValueAsSelectList() {
        const columnData = this.constraintFilterColumnData;
        return Array.from(ColumnData.GetValueSet(columnData) as Set<number | string>)
            .sort()
            .map(value => {
                switch (columnData.type) {
                    case "number": {
                        return {
                            value: +value,
                            text: +value,
                        }
                    }

                    case "string": {
                        return {
                            value: "" + value,
                            text: "" + value,
                        }
                    }
                }

                throw new Error("Unknown column type");
            });
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
            this.constraintFilterColumnData.type === "number"
        );
    }

    get showFilterValueAsSelect() {
        return (
            this.showFilterFunction &&
            this.constraintFilterColumnData.type === "string"
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

    async deleteConstraint() {
        await S.dispatch(S.action.DELETE_CONSTRAINT, this.constraint);
    }

    async updateConstraint<T extends IConstraint>(diff: DeepPartial<T>) {
        // Deep copy and merge in diff
        const newConstraint = deepMerge<IConstraint>(deepCopy(this.constraint), diff as any);

        await S.dispatch(S.action.UPSERT_CONSTRAINT, newConstraint);
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
            // Type and condition functions for different constraints vary
            type: this.getConstraintType(newValue) as any,
            condition: {
                function: newValue as any,
            },
        });
    }

    get constraintConditionCount() {
        return (this.constraint.condition as any).value;
    }

    set constraintConditionCount(newValue: any) {
        this.updateConstraint<IConstraint_Count>({
            condition: {
                value: parseUint32(newValue, this.constraintConditionCount),
            },
        });
    }

    get constraintFilterColumnData() {
        return ColumnData.ConvertToDataObject(S.state.recordData.columns, this.constraint.filter.column)!;
    }

    set constraintFilterColumnData(newColumnData: IColumnData) {
        const oldColumnData = this.constraintFilterColumnData;
        const oldFilterValue = this.constraintFilterValues;

        this.updateConstraint({
            filter: {
                column: ColumnData.ConvertToMinimalDescriptor(newColumnData),
            },
        });

        // We need to convert the filter value if the types are different, or
        // trigger an automatic realignment of the filter value for different
        // columns of the same type by forcing another save.
        // 
        // This can only happen after the above column change has been
        // reconciled and hence sits within a Vue.nextTick().
        this.$nextTick(() => {
            const oldColumnType = oldColumnData.type;
            const newColumnType = newColumnData.type;

            if (oldColumnType !== newColumnType ||
                !ColumnData.Equals(oldColumnData, newColumnData)) {
                switch (newColumnType) {
                    case "number": {
                        this.constraintFilterValues = +oldFilterValue || 0;
                        break;
                    }
                    case "string": {
                        this.constraintFilterValues = "" + oldFilterValue;
                        break;
                    }
                    default: {
                        throw new Error("Unknown column type");
                    }
                }
            }
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
        this.updateConstraint<IConstraint_Count | IConstraint_Limit>({
            filter: {
                // Filter functions for different constraints vary
                function: newValue as any,
            },
        });
    }

    get constraintFilterValues() {
        // NOTE: Values is an array, but we only support single values for now
        const filterValue: string | number = ((this.constraint.filter as any).values || [])[0];
        return filterValue;
    }

    set constraintFilterValues(newValue: string | number) {
        // NOTE: Values is an array, but we only support single values for now

        let newFilterValue: string | number;

        switch (this.constraintFilterColumnData.type) {
            case "number": {
                const oldValue = this.constraintFilterValues;

                // Any parseable numeric string is acceptable, except for empty
                // string
                if (typeof newValue === "string" && newValue.trim().length === 0) {
                    newFilterValue = oldValue;
                } else {
                    const validDecimalNumericStringRegex = /^-?\d+\.?\d*$/;

                    const parsedNewValue = parse(newValue, Number.NaN);

                    // * Check that the number is valid
                    //
                    // * Check that the numeric value is properly representable 
                    //   as a plain fixed decimal number by checking that its
                    //   string representation is valid as a decimal number
                    // 
                    //   This can happen in the case of long numbers
                    //   (e-notation) or large numbers that JS can't handle 
                    //   ("Infinity")
                    if (Number.isNaN(parsedNewValue) ||
                        !("" + parsedNewValue).match(validDecimalNumericStringRegex)) {
                        newFilterValue = oldValue;
                    } else {
                        newFilterValue = newValue;
                    }
                }

                break;
            }

            case "string": {
                newFilterValue = "" + newValue;
                break;
            }

            default: {
                throw new Error("Unknown column type");
            }
        }

        // If the filter value is determined by a select list and the filter
        // value does not exist within the list, then set the filter value to
        // the first available option
        if (this.showFilterValueAsSelect &&
            // You must compare the string values or they may not match
            this.filterValueAsSelectList.findIndex(item => item.value === newFilterValue) < 0) {
            newFilterValue = this.filterValueAsSelectList[0].value;
        }

        this.updateConstraint({
            filter: {
                values: [
                    newFilterValue,
                ],
            },
        });
    }

    get constraintGroupSizeApplicabilityCondition() {
        return this.constraint.applicability.find(condition => condition.type === "group-size");
    }

    set constraintGroupSizeApplicabilityCondition(newValue: IConstraint_ApplicabilityGroupSizeCondition | undefined) {
        // Copy applicability array with group size applicability conditions 
        // filtered out
        const applicabilityArray =
            this.constraint.applicability
                .slice()
                .filter(condition => condition.type !== "group-size");

        // When we have a new group size applicability condition, insert that in
        if (newValue !== undefined) {
            applicabilityArray.push(newValue);
        }

        this.updateConstraint({
            applicability: applicabilityArray,
        });
    }

    get groupSizeApplicabilityConditionPersonUnitNoun() {
        if (this.constraintGroupSizeApplicabilityCondition === undefined) {
            return "people";
        }

        if (this.constraintGroupSizeApplicabilityCondition.value === 1) {
            return "person";
        }

        return "people";
    }

    get groupSizeApplicabilityConditionValue() {
        if (this.constraintGroupSizeApplicabilityCondition === undefined) {
            return undefined;
        } else {
            return this.constraintGroupSizeApplicabilityCondition.value;
        }
    }

    set groupSizeApplicabilityConditionValue(newValue: number | undefined) {
        if (newValue === undefined) {
            this.constraintGroupSizeApplicabilityCondition = undefined;
            return;
        }

        // Update constraint applicability condition
        this.constraintGroupSizeApplicabilityCondition = {
            type: "group-size",
            function: "eq",
            value: newValue,
        };
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

.select[disabled],
.input[disabled] {
    border-bottom-color: transparent;

    font-style: italic;

    cursor: inherit;
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
</style>
