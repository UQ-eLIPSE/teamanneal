<template>
    <div v-if="sortedTestPermutationData !== undefined && data.cursor === 'targetGroup'"
         class="test-permutations">
        <h5>Suggestions</h5>
        <ul class="suggestions">

            <li v-for="x in sortedTestPermutationData"
                class="suggestion"
                :key="x.toNode"
                @click="groupSelected(x.toNode)">
                <span :title="getAncestors(x.toNode).join(' > ')"
                      class="ancestors">{{ getAncestors(x.toNode).join(" > ") }}</span>
                <span class="content improvement"
                      :class="getSatisfactionChangeClass(x.satisfaction.value)">Satisfaction: {{ getSatisfactionPercentChangeFormatted(x.satisfaction.value)}}</span>

            </li>
        </ul>
        <button class="button secondary small"
                @click="clearSatisfactionTestPermutationData">Close suggestions</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { MoveRecordTestPermutationOperationResult } from "../../../common/ToClientSatisfactionTestPermutationResponse";
import { Suggestions } from "../data/Suggestions";

@Component
export default class MoveSuggestionsDisplay extends Vue {

    @Prop sortedTestPermutationData = p<MoveRecordTestPermutationOperationResult>({ required: true });
    @Prop data = p<any>({ required: true });

    get currentConfigurationSatisfactionValue() {
        const sourcePerson = this.data.sourcePerson;
        if (sourcePerson === undefined) return undefined;

        const selectedNodeId = sourcePerson.node;
        const sortedTestPermutationData = this.sortedTestPermutationData;

        if (sortedTestPermutationData === undefined) {
            return undefined;
        }

        const satisfactionObject = sortedTestPermutationData.find((p) => p.toNode === selectedNodeId);

        return satisfactionObject === undefined ? undefined : { value: satisfactionObject.satisfaction.value, max: satisfactionObject.satisfaction.max };
    }

    getAncestors(id: string) {
        return Suggestions.getAncestors(id);
    }
    groupSelected(targetNodeId: string) {
        this.$emit("groupSelected", targetNodeId);
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
