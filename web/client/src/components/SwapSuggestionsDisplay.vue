<template>
    <div v-if="sortedTestPermutationData !== undefined && data.cursor === 'personB'"
         class="test-permutations">
        <h5>Suggestions</h5>
        <ul class="suggestions">
            <li v-for="x in sortedTestPermutationData"
                class="suggestion"
                :key="x.nodeB + x.recordIdB"
                @click="personBSelected(x.nodeB, x.recordIdB)">

                <span class="ancestors">{{getAncestors(x.nodeB).join(' > ')}}</span>
                <div class="content"
                     :class="getSatisfactionChangeClass(x.satisfaction.value)">
                    <span>{{x.recordIdB}}</span>
                    <span>Satisfaction: {{ getSatisfactionPercentChangeFormatted(x.satisfaction.value)}} </span>
                </div>
            </li>
        </ul>
        <button class="button secondary small"
                @click="clearSatisfactionTestPermutationData">Close suggestions</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { SwapRecordsTestPermutationOperationResult } from "../../../common/ToClientSatisfactionTestPermutationResponse";
import { Suggestions } from "../data/Suggestions";

@Component
export default class SwapSuggestionsDisplay extends Vue {

    @Prop sortedTestPermutationData = p<SwapRecordsTestPermutationOperationResult>({ required: true });
    @Prop data = p<any>({ required: true });


    personBSelected(nodeId: string, recordId: string) {
        this.$emit("personBSelected", nodeId, recordId);
    }
    get currentConfigurationSatisfactionValue() {
        const personA = this.data.personA;
        if (personA === undefined) return undefined;

        const selectedNodeId = personA.node;
        const sortedTestPermutationData = this.sortedTestPermutationData;

        if (sortedTestPermutationData === undefined) {
            return undefined;
        }

        const satisfactionObject = sortedTestPermutationData.find((p) => p.nodeB === selectedNodeId);

        return satisfactionObject === undefined ? undefined : { value: satisfactionObject.satisfaction.value, max: satisfactionObject.satisfaction.max };
    }

    getAncestors(id: string) {
        return Suggestions.getAncestors(id);
    }

    clearSatisfactionTestPermutationData() {
        this.$emit("clearSuggestions");
    }

    getSatisfactionPercentChange(satisfactionValue: number) {
        const satisfactionObject = this.currentConfigurationSatisfactionValue;
        if (satisfactionObject === undefined) {
            return;
        }

        const percentChange = ((satisfactionValue - satisfactionObject.value) / satisfactionObject.max) * 100;

        return percentChange;
    }

    getSatisfactionPercentChangeFormatted(satisfactionValue: number) {
        const percentChange = this.getSatisfactionPercentChange(satisfactionValue);
        if (percentChange === undefined) return;

        if (percentChange >= 0) {
            return "+" + percentChange + "%";
        }

        return percentChange + "%";
    }

    getSatisfactionChangeClass(satisfactionValue: number) {
        const classes = [];
        const percentChange = this.getSatisfactionPercentChange(satisfactionValue);

        if (percentChange === undefined) return;

        if (percentChange >= 0) {
            classes.push("positive");
        } else if (percentChange < 0) {
            classes.push("negative");
        }

        return classes;
    }


}
</script>

<!-- ####################################################################### -->

<style scoped src="../static/results-editor-side-panel.css"></style>

<style scoped>
.test-permutations {
    background: rgba(220, 220, 220, 1);
    padding: 0.5rem;
    height: 50%;
    display: flex;
    justify-content: space-evenly;
    flex-direction: column;
}

.test-permutations>h5 {
    color: #49075E;
    font-style: italic;
    margin: 0.5rem 0;
}

.suggestions {
    display: flex;
    flex-flow: column;
    list-style-type: none;
    padding: 0.5rem 0;
    margin: 0;
    height: 75%;
    overflow: auto;
}

.suggestion {
    display: flex;
    flex-direction: column;
    background: #fefefe;
    border: 0.1em solid rgba(1, 0, 0, 0.1);
    overflow: auto;
    cursor: pointer;
    flex-shrink: 0;
    margin: 0.5rem;
}

.suggestion .ancestors {
    background: #49075e;
    color: #fff;
    text-overflow: ellipsis;
    padding: 0.5rem;
}

.suggestion .content {
    padding: 0.5rem;
}

.positive {
    background: rgba(53, 146, 56, 0.2);
}

.negative {
    background: rgba(171, 39, 45, 0.2);
}
</style>
