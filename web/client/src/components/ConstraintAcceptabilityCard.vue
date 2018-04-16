<template>
    <div class="constraint-item"
         :class="constraintItemClasses">
        <div class="sentence-groups">
            <div class="sentence">
                <span>{{constraintSentence}}</span>
            </div>
            <div class="number-of-groups">
                <span>
                    <b>{{fulfilledNumber}}/{{totalGroups}}</b>
                </span>
                <span>{{lowerCaseStratumLabel}}s</span>
            </div>
        </div>

        <div class="slider-wrapper"
             v-if="isLimitTypeConstraint">
            <span>Choose an acceptable percentage of {{ lowerCaseStratumLabel }} members with </span>
            <span class="constraint-filter-text">{{constraintFilterText}}</span>
            <!-- <span>0</span> -->
            <input type="range"
                   @input="constraintAcceptabilityChanged($event)"
                   :value="constraintAcceptability"
                   min="0"
                   max="100"
                   step="0.01" />
            <!-- <span>100</span> -->
            <span class="acceptability-value">{{constraintAcceptability}}%</span>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Data as IConstraint } from "../data/Constraint";
import { ConstraintSentence } from "../data/Constraint";

@Component
export default class ConstraintAcceptabilityCard extends Vue {
    @Prop constraint = p<IConstraint>({ required: true, });

    @Prop isSelected = p({ type: Boolean, required: false, default: false, });
    @Prop stratumLabel = p({ type: String, required: true });
    @Prop fulfilledNumber = p({ type: Number, required: true });
    @Prop totalGroups = p({ type: Number, required: true });
    @Prop constraintThreshold = p({ type: Number, required: true });

    get constraintAcceptability() {
        return this.constraintThreshold.toString();
    }

    constraintAcceptabilityChanged(e: any) {
        this.$emit("constraintAcceptabilityChanged", this.constraint, parseFloat(e.currentTarget.value));
    }
    get constraintSentence() {
        const sentence = ConstraintSentence.convertConstraintToSentence(this.constraint, this.lowerCaseStratumLabel);
        return sentence[0].toUpperCase() + sentence.slice(1);
    }

    get constraintFilterText() {
        const phrase = ConstraintSentence.getConstraintFilterText(this.constraint);
        return phrase.toLowerCase();
    }

    get lowerCaseStratumLabel() {
        return this.stratumLabel.toLowerCase();
    }

    get isLimitTypeConstraint() {
        return this.constraint.type === "limit";
    }

    get constraintItemClasses() {
        return {
            "selected": this.isSelected,
        };
    }
}
</script>

<style scoped>
.constraint-item {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    text-decoration: none;
    color: inherit;
    border: 0.2em solid rgba(0, 0, 0, 0.1);
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

.sentence-groups {
    display: flex;
    min-height: 5rem;
}

.sentence {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 60%;
    padding: 0.5em;
}

.number-of-groups {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(40, 150, 90, 0.7);
    color: white;
    font-size: 1.2em;
    min-width: 20%;
}

.slider-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 0.5rem;
    border-top: 0.1em solid rgba(100, 100, 100, 0.1);
    padding: 1rem 0.5rem;
    width: 90%;
    
}

.slider-wrapper>input {
    width: 90%;
}

.constraint-filter-text, .acceptability-value {
    color: #49075E;
    font-weight: 500;
}

.acceptability-value {
    font-size: 1.3em;
}

</style>
