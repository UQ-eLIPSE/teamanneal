<template>
    <div class="constraint-item"
         :class="constraintItemClasses">
        <div class="sentence-groups">
            <div class="sentence">
                <span>{{constraintSentence}}</span>

            </div>
            <div class="number-of-groups"
                 :class="cardClasses">
                <span class="number">{{fulfilledNumber}}</span>
                <span class="number number-bottom">{{totalGroups}}</span>
                <span>pass</span>
            </div>
        </div>


        <div class="slider-wrapper"
             v-if="isLimitTypeConstraint">

            <span>I'm satisfied if</span>
            <span class="limit-constraint-description-number">{{limitConstraintDescriptionNumber}}</span>

            <span> of {{lowerCaseStratumLabel}} members have </span>
            <span class="constraint-filter-text">{{constraintFilterText}}</span>
            
            
            <input type="range"
                   @input="constraintAcceptabilityChanged($event)"
                   :value="constraintAcceptability"
                   min="0"
                   max="100"
                   step="0.1" />
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
        const threshold = parseFloat(e.currentTarget.value);
        this.$emit("constraintAcceptabilityChanged", this.constraint, threshold);
    }
    get constraintSentence() {
        const sentence = ConstraintSentence.convertConstraintToSentence(this.constraint, this.lowerCaseStratumLabel);
        return sentence[0].toUpperCase() + sentence.slice(1);
    }

    get constraintFilterText() {
        const phrase = ConstraintSentence.getConstraintFilterText(this.constraint);
        return phrase.toLowerCase();
    }

    get limitConstraintDescriptionNumber() {
        let phrase = "";
        if (this.constraint.condition.function === "high") {
            phrase += (this.constraintThreshold).toFixed(1) + "%";
        } else {
            phrase += (100 - this.constraintThreshold).toFixed(1) + "%";
        }

        return phrase;

    }

    get lowerCaseStratumLabel() {
        return this.stratumLabel.toLowerCase();
    }

    get isLimitTypeConstraint() {
        return this.constraint.type === "limit";
    }

    get isConstraintConditionFunctionLow() {
        return this.constraint.condition.function === "low";
    }

    get constraintItemClasses() {
        return {
            "selected": this.isSelected,
        };
    }

    get cardClasses() {
        const passingGroupsPerc = (this.fulfilledNumber / this.totalGroups) * 100;
        return {
            "danger": passingGroupsPerc === 0,
            "success": passingGroupsPerc > 60,
            "medium": passingGroupsPerc < 60 && passingGroupsPerc > 0
        }
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
    font-size: 1em;

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
    flex-direction: column;
    align-items: center;
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
    color: white;
    min-width: 20%;
    padding: 0.5rem 0;
    flex-shrink: 0;
}

.danger {
    background: rgb(217, 83, 79);
}

.success {
    background: rgba(40, 150, 90, 0.7);
}

.medium {
    background: rgb(240, 173, 78)
}

.number-of-groups .number {
    font-size: 1.1em;
    font-weight: bold;
}

.slider-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    border-top: 0.1em solid rgba(100, 100, 100, 0.1);
    width: 90%;
}

.slider-wrapper>input {
    width: 100%;
}

.constraint-filter-text,
.acceptability-value {
    color: #49075E;
    font-weight: 500;
}

.limit-constraint-description-number {
    color: #49075E;
    font-weight: 500;
    border-bottom: 1px dotted #49075E;
}

.acceptability-value {
    font-size: 1.2em;
}

.number-bottom {
    border-top: 1px solid white;
    padding-top: 0.3rem;
    margin-top: 0.3rem;
}
</style>
