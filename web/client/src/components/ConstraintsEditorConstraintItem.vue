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
                <span class="popover-link-area">
                    <a href="#"
                       @click.prevent="onGroupSizeApplicabilityConditionValueClick">{{ groupSizeApplicabilityConditionDisplayedValue }} {{ groupSizeApplicabilityConditionPersonUnitNoun }}</a>
                    <div class="popover"
                         v-if="groupSizeApplicabilityConditionPopoverVisible">
                        <ul>
                            <li>
                                <label>
                                    <input type="radio"
                                           name="groupSizeApplicabilityConditionPresence"
                                           value="not-specified"
                                           v-model="groupSizeApplicabilityConditionPresence"> any number of people</label>
                            </li>
                            <li @click="onGroupSizeApplicabilityConditionValueInputFieldClick">
                                <label>
                                    <input type="radio"
                                           name="groupSizeApplicabilityConditionPresence"
                                           value="specified"
                                           v-model="groupSizeApplicabilityConditionPresence">
                                    <DynamicWidthInputField class="input"
                                                            :minWidth="5"
                                                            :disabled="constraintGroupSizeApplicabilityCondition === undefined"
                                                            v-model="groupSizeApplicabilityConditionValue"></DynamicWidthInputField> {{ groupSizeApplicabilityConditionPersonUnitNoun }}</label>
                            </li>
                        </ul>
                    </div>
                </span>
            </span>
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

import * as Stratum from "../data/Stratum";
import * as Constraint from "../data/Constraint";
import * as ColumnInfo from "../data/ColumnInfo";

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

    // Private
    groupSizeApplicabilityConditionPopoverVisible: boolean = false;

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
        const columnInfo = this.constraintFilterColumnInfo;
        return Array.from(columnInfo.valueSet as Set<number | string>)
            .sort()
            .map(value => {
                switch (columnInfo.type) {
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








    get groupSizeApplicabilityConditionFragmentClasses() {
        return {
            "group-size-specified": this.constraintGroupSizeApplicabilityCondition !== undefined,
            "popover-active": this.groupSizeApplicabilityConditionPopoverVisible,
        }
    }

    get groupSizeApplicabilityConditionDisplayedValue() {
        if (this.constraintGroupSizeApplicabilityCondition === undefined) {
            return "any number of";
        } else {
            return "" + this.constraintGroupSizeApplicabilityCondition.value;
        }
    }

    onGroupSizeApplicabilityConditionValueClick() {
        const newVisibleState = !this.groupSizeApplicabilityConditionPopoverVisible;
        this.groupSizeApplicabilityConditionPopoverVisible = newVisibleState;

        // When menu is now open...
        if (newVisibleState) {
            // Get the element that wraps the fragment
            const groupSizeMenuElement: HTMLSpanElement | null =
                this.$el.querySelector("span.group-size-applicability-condition-fragment") as HTMLSpanElement;

            if (groupSizeMenuElement === null) {
                // No element to work with
                return;
            }

            // Focus on radio buttons after Vue updates
            Vue.nextTick(() => {
                const checkedPresenceOption: HTMLInputElement | null =
                    groupSizeMenuElement.querySelector("input[name=groupSizeApplicabilityConditionPresence]:checked") as HTMLInputElement;

                if (checkedPresenceOption !== null) {
                    checkedPresenceOption.focus();
                }
            });

            // Attach blur handler for menu
            const blurHandlerDocumentEvents = [
                "click",
                "focusin",
            ];

            const isDescendantOfGroupSizeMenu = (child: Node) => {
                var node = child.parentNode;
                while (node != null) {
                    if (node === groupSizeMenuElement) {
                        return true;
                    }
                    node = node.parentNode;
                }
                return false;
            }

            const blurHandler = (e: Event) => {
                if (isDescendantOfGroupSizeMenu(e.target as Node)) {
                    // Ignore if event occurred within group size menu
                    return;
                }

                // Close menu on blur
                this.groupSizeApplicabilityConditionPopoverVisible = false;

                // Clean up after blurring by detaching handlers
                blurHandlerDocumentEvents.forEach(type => document.removeEventListener(type, blurHandler));
            }

            // Attach blur handler
            blurHandlerDocumentEvents.forEach(type => document.addEventListener(type, blurHandler));
        }
    }

    onGroupSizeApplicabilityConditionValueInputFieldClick() {
        // Always activate the input field when clicked on
        this.groupSizeApplicabilityConditionPresence = "specified";
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
        const oldColumnInfo = this.constraintFilterColumnInfo;
        const oldFilterValue = this.constraintFilterValues;
        const newColumnInfo = newValue;

        this.updateConstraint({
            filter: {
                column: newColumnInfo.index,
            },
        });

        // We need to convert the filter value if the types are different, or
        // trigger an automatic realignment of the filter value for different
        // columns of the same type by forcing another save.
        // 
        // This can only happen after the above column change has been
        // reconciled and hence sits within a Vue.nextTick().
        Vue.nextTick(() => {
            const oldColumnType = oldColumnInfo.type;
            const newColumnType = newValue.type;

            if (oldColumnType !== newColumnType ||
                oldColumnInfo.index !== newColumnInfo.index) {
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
        this.updateConstraint({
            filter: {
                function: newValue,
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

        switch (this.constraintFilterColumnInfo.type) {
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

    set constraintGroupSizeApplicabilityCondition(newValue: any | undefined) {
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

    get groupSizeApplicabilityConditionPresence() {
        if (this.constraintGroupSizeApplicabilityCondition === undefined) {
            return "not-specified";
        } else {
            return "specified";
        }
    }

    set groupSizeApplicabilityConditionPresence(newValue: string) {
        switch (newValue) {
            case "not-specified": {
                // Delete the group size applicability condition
                this.constraintGroupSizeApplicabilityCondition = undefined;
                return;
            }
            case "specified": {
                // Default to 2 if condition not previously set
                if (this.groupSizeApplicabilityConditionPresence !== "specified") {
                    this.groupSizeApplicabilityConditionValue = "2";
                }

                return;
            }
        }

        throw new Error("Group size applicability presence value invalid");
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
            return "some number of";
        } else {
            return "" + this.constraintGroupSizeApplicabilityCondition.value;
        }
    }

    set groupSizeApplicabilityConditionValue(newValue: string) {
        const existingGroupSizeApplicabilityCondition = this.constraintGroupSizeApplicabilityCondition;

        const groupSizeValue = parseUint32(newValue, (existingGroupSizeApplicabilityCondition || {}).value || 0);

        // Update constraint applicability condition
        this.constraintGroupSizeApplicabilityCondition = {
            type: "group-size",
            function: "eq",
            value: groupSizeValue,
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

.group-size-applicability-condition-fragment .popover-link-area {
    display: inline-block;
}

.group-size-applicability-condition-fragment .popover-link-area a {
    background: none;
    text-decoration: none;

    display: block;

    border: 0;
    border-bottom: 1px dotted;

    padding: 0 0.2em;

    color: inherit;

    cursor: pointer;
}

.group-size-applicability-condition-fragment.popover-active .popover-link-area a {
    outline: 2px solid #608;
    border-bottom-color: transparent;
}

.group-size-applicability-condition-fragment .popover {
    position: absolute;
    display: inline-block;

    background: #fff;
    padding: 0.5em;

    min-width: 13em;
    font-size: 0.7em;

    margin-left: -2px;

    border: 2px solid #608;
}

.group-size-applicability-condition-fragment .popover ul {
    padding: 0;
    list-style: none;
}

.group-size-applicability-condition-fragment .popover .input[disabled] {
    padding: 0;
}
</style>
