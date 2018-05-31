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
                <div class="field" :class="getSatisfactionChangeClass(x.satisfaction.value)">
                    <span class="label">Satisfaction</span>
                    <span class="value">{{ getSatisfactionPercentChangeFormatted(x.satisfaction.value)}}</span>
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
import { MoveRecordTestPermutationOperationResult } from "../../../common/ToClientSatisfactionTestPermutationResponse";
import { Suggestions } from "../data/Suggestions";
import { MoveSidePanelToolData } from "../data/MoveSidePanelToolData";

@Component
export default class MoveSuggestionsDisplay extends Vue {

    @Prop sortedTestPermutationData = p<MoveRecordTestPermutationOperationResult>({ required: true });
    @Prop data = p<MoveSidePanelToolData>({ required: true });

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

        const formatted = percentChange.toFixed(2);

        if (percentChange >= 0) {
            return "+" + formatted + "%";
        }

        return formatted + "%";
    }

    getSatisfactionChangeClass(satisfactionValue: number) {
        const classes = [];
        const percentChange = this.getSatisfactionPercentChange(satisfactionValue);

        if (percentChange === undefined) return;

        if (percentChange > 0) {
            classes.push("positive");
        } else if (percentChange < 0) {
            classes.push("negative");
        } else if(percentChange === 0) {
            classes.push("neutral");
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
    height: 65%;
    display: flex;
    flex-direction: column;
}

.test-permutations>h5 {
    color: #49075E;
    margin: 0.25rem 0.5rem;
}

.suggestions {
    display: flex;
    flex-flow: column;
    list-style-type: none;
    padding: 0;
    margin: 0;
    height: 100%;
    overflow: auto;
}

.suggestion {
    display: flex;
    flex-direction: column;
    border: 0.1em solid rgba(1, 0, 0, 0.1);
    overflow: auto;
    cursor: pointer;
    flex-shrink: 0;
    margin: 0.25rem;
    font-size: 0.9em;
}

.suggestion .ancestors {
    background: rgba(0,0,0,0.6);
    color: #fff;
    text-overflow: ellipsis;
    padding: 0.25rem;
}

.field {
    display: flex;
    justify-content: space-between;
    flex-wrap:wrap;
    padding: 0.5rem;
}

.value {
    font-weight: bold;
}
.positive {
    background: rgba(53, 146, 56, 0.2);
}

.negative {
    background: rgba(171, 39, 45, 0.2);
}

.neutral {
    background: #eee;
}
</style>
