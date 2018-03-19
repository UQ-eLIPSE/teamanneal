<template>
    <a class="constraint-item"
       :class="constraintItemClasses"
       href="#"
       @click.prevent.stop="selectConstraint">
        <h5>Constraint</h5>
        <p>{{constraintSentence}}</p>
        <!-- TODO: Decide what is "low" for non-binary satisfaction values -->
        <meter :value="fulfilledPercentage"
               max="100"
               low="50"
               min="0"></meter>
        {{fulfilledPercentage.toFixed(0)}}% of {{selectedStratum.label}}s match
    </a>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";
import { ConstraintPhraseMaps } from "../data/Constraint";

@Component
export default class ConstraintSatisfactionDashboardConstraint extends Vue {
    @Prop constraint = p<IConstraint>({ required: true, });

    @Prop isSelected = p({ type: Boolean, required: false, default: false, });

    /** Currently represents an average value of `constraint` satisfaction across strata */
    @Prop fulfilledPercentage = p<number>({ required: false, default: () => 0 });

    /** The currently selected stratum by parent component (for filtering constraints) */
    @Prop selectedStratum = p<any>({ required: false });

    /** Returns store state */
    get state() {
        return this.$store.state as IState;
    }

    /** Emits `constraintSelected` event when a constraint card is clicked */
    selectConstraint() {
        this.$emit("constraintSelected", this.constraint);
    }

    /** Constructs a phrase from the key-values in the `constraint` prop. */
    get constraintSentence() {
        let sentence = "";

        sentence += this.selectedStratum.label + ' ';
        sentence += this.getWeightText();
        sentence += this.getConstraintConditionFunctionText();
        sentence += this.getPersonUnitText();
        sentence += this.getConstraintFilterText();
        sentence += ' when ' + this.selectedStratum.label + ' has ';
        sentence += this.getConstraintGroupApplicabilityText();

        return sentence;
    }

    getWeightText() {
        return this.findItemInList(ConstraintPhraseMaps.CostWeightList, "value", this.constraint.weight).text + ' ';
    }

    getConstraintConditionFunctionText() {
        let phrase = this.findItemInList(ConstraintPhraseMaps.ConditionFunctionList, "value", this.constraint.condition.function).text + ' ';
        if (this.showConditionCount) {
            phrase += (this.constraint.condition as any).value + ' ';
        }

        return phrase;
    }

    getPersonUnitText() {
        if (this.personUnitNounFollowsCondition) {
            return this.personUnitNoun + ' with ';
        }
        return '';
    }

    getConstraintFilterText() {
        let phrase = this.constraint.filter.column.label + ' ';

        if (this.showFilterFunction) {
            phrase += this.constraintFilterFunction + ' ' + (this.constraint.filter as any).values[0];
        }

        return phrase;
    }

    getConstraintGroupApplicabilityText() {
        return this.constraintApplicabilityPhrase + ' ' + this.groupSizeApplicabilityConditionPersonUnitNoun;
    }

    // -------------------------------------------------
    // Utility functions for building constraint phrases
    // -------------------------------------------------

    /**
     * Determines if the person unit noun ("person" or "people") comes after
     * the condition function text in the constraint sentence
     */
    get personUnitNounFollowsCondition() {
        switch (this.constraint.condition.function) {
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    get constraintApplicability() {
        const groupSizeApplicability = this.constraint.applicability.find((applicabilityObject) => applicabilityObject.type === 'group-size');
        if (groupSizeApplicability !== undefined) {
            return groupSizeApplicability.value;
        }

        return undefined;
    }

    get constraintApplicabilityPhrase() {
        return this.constraintApplicability || " any number of ";
    }

    get showFilterFunction() {
        switch (this.constraint.condition.function) {
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    get constraintFilterFunction() {
        const filterType = this.constraint.filter.column.type;
        const list = filterType === "number" ? ConstraintPhraseMaps.NumberFilterFunctionList : ConstraintPhraseMaps.StringFilterFunctionList;
        return this.findItemInList(list, "value", (this.constraint.filter as any).function).text;
    }

    /**
     * Generates the appropriate (pluralised) noun for the constraint sentence
     */
    get personUnitNoun() {
        // If the count is exactly one, return "person"
        if (this.showConditionCount && (this.constraint.condition as any).value === 1) {
            return "person";
        } else {
            return "people";
        }
    }

    get showConditionCount() {
        switch (this.constraint.condition.function) {
            case "low":
            case "high":
            case "similar":
            case "different":
                return false;
        }

        return true;
    }

    get groupSizeApplicabilityConditionPersonUnitNoun() {
        if (this.constraintApplicability === undefined) {
            return "people";
        }

        if (this.constraintApplicability === 1) {
            return "person";
        }

        return "people";
    }

    /**
     * A generic function used for finding array items for `value-text` maps in `ConstraintPhraseMaps` (see import)
     */
    findItemInList(list: any[], property: string, value: any) {
        return list.find((listItem: any) => listItem[property] === value);
    }

    get constraintItemClasses() {
        return {
            "selected": this.isSelected,
        };
    }
}
</script>

<style scoped>
h5 {
    color: #49075E;
    font-size: 1.2em;
    margin: 0.2em;
    align-self: flex-start;
}

.constraint-item {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    text-decoration: none;
    color: inherit;
    border: 0.2em solid rgba(0, 0, 0, 0.1);
    padding: 0.5em;
    font-size: 0.8em;
    align-items: center;

    position: relative;
}

.constraint-item.selected {
    border-color: #49075E;
    background: rgba(73, 7, 94, 0.2);
}

.constraint-item.selected::after {
    content: "✓";
    display: inline-block;

    color: #fff;
    background: linear-gradient(to right top, transparent, transparent 50%, #49075E 50%, #49075E);
    font-weight: bold;
    text-align: right;

    position: absolute;
    top: 0;
    right: 0;

    width: 2em;
    height: 2em;
}

.constraints-container {
    display: flex;
    flex-direction: column;
}

.constraint-box {
    border: 1px solid black;
}

meter {
    width: 100%;
}
</style>
