<template>
    <a class="constraint-item"
       href="#"
       @click.prevent.stop="selectConstraint">
        <h5>Constraint</h5>
        <p>{{constraintPhrase}}</p>
        <!-- TODO: Decide what is "low" for non-binary satisfaction values -->
        <meter :value="fulfilledPercentage"
               max="100"
               low="50"
               min="0"></meter>
        {{fulfilledPercentage.toFixed(0)}}% of {{currentStratum.label}}s match
        
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
    @Prop fulfilledPercentage = p<number>({ required: false, default: () => 0 });
    @Prop currentStratum = p<any>({ required: false });
    get state() {
        return this.$store.state as IState;
    }

    selectConstraint() {
        this.$emit("constraintSelected", this.constraint);
    }

    get constraintsArray() {
        return this.state.annealConfig.constraints;
    }


    get constraintPhrase() {
        let phrase = "";
        phrase += this.currentStratum.label + ' ';
        phrase += this.findItemInList(ConstraintPhraseMaps.CostWeightList, this.constraint.weight).text + ' ';
        phrase += this.findItemInList(ConstraintPhraseMaps.ConditionFunctionList, this.constraint.condition.function).text + ' ';
        if (this.showConditionCount) {
            phrase += (this.constraint.condition as any).value + ' ';
        }

        if (this.personUnitNounFollowsCondition) {
            phrase += this.personUnitNoun + ' with ';
        }

        phrase += this.constraint.filter.column.label + ' ';

        if (this.showFilterFunction) {
            phrase += this.constraintFilterFunction + ' ' + (this.constraint.filter as any).values[0];
        }

        phrase += ' when ' + this.currentStratum.label + ' has ';

        phrase += this.constraintApplicabilityPhrase + ' ' + this.groupSizeApplicabilityConditionPersonUnitNoun;


        return phrase;
    }

    /**
     * Determines if the person unit noun ("person" or "people") comes after
     * the condition function selection menu in the constraints editor sentence
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
        return this.findItemInList(list, (this.constraint.filter as any).function).text;
    }

    /**
     * Generates the appropriate (pluralised) noun for the constraints editor
     * sentence
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

    findItemInList(list: any[], value: any) {
        return list.find((listItem: any) => listItem.value === value);
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
}
</script>

<style scoped>
h5 {
    color: #49075E;
    font-size: 1.2em;
    margin: 0.2em;
    align-self: flex-start;
}

a.constraint-item {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    text-decoration: none;
    color: inherit;
    border: 0.2em solid rgba(1,1,1,0.1);
    padding: 0.5em;
    font-size: 0.8em;
    align-items: center;
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