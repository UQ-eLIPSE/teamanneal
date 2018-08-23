<template>
    <div v-if="sortedTestPermutationData !== undefined && data.cursor === 'targetGroup'"
         class="test-permutations">
        <h5>Suggestions</h5>

        <table class="suggestions">
            <tr>
                <th width="70%">Move to ...</th>
                <th width="30%">% Change in satisfaction</th>
            </tr>

            <tr class="suggestion" v-for="x in sortedTestPermutationData" :key="x.toNode"
                @click="groupSelected(x.toNode)">
                <td class="ancestors" :title="getAncestors(x.toNode).join(' > ')" width="70%">
                     <span :title="getAncestors(x.toNode).join(' > ')" v-for="ancestor in getAncestors(x.toNode)" :key="ancestor">{{ancestor}}</span>
                </td>
                <td class="value" width="30%" :class="getSatisfactionChangeClass(x.satisfaction.value)">{{ getSatisfactionPercentChangeFormatted(x.satisfaction.value) }}</td>    
            </tr>
        </table>
        <!-- <ul class="suggestions">
            <li v-for="x in sortedTestPermutationData"
                class="suggestion"
                :key="x.toNode"
                @click="groupSelected(x.toNode)">
                <div class="ancestors">
                    <span :title="getAncestors(x.toNode).join(' > ')" v-for="ancestor in getAncestors(x.toNode)" :key="ancestor">{{ancestor}}</span>
                </div>
                <div :class="getSatisfactionChangeClass(x.satisfaction.value)" class="satisfaction-value">{{getSatisfactionPercentChangeFormatted(x.satisfaction.value)}}</div>
            </li>
        </ul> -->
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
    background: white;
    border: none;
    outline: 0.1em solid rgba(1, 0, 0, 0.1);
    cursor: pointer;
    margin: 0.25rem;
    font-size: 0.9em;
}

table {
    border-collapse: collapse;
}

table, th, td {
    border: 1px solid black;
}

th {
    background-color: #49075e;
    color: white;
}

td {
    background-color: white;
}



.ancestors {
    padding: 0.5rem;
}

.ancestors>* {
    display: inline-block;
}
.ancestors>*:nth-child(n+2)::before {
    content: "";
    border-style: solid;
    border-width: 0.15em 0.15em 0 0;
    display: inline-block;
    height: 0.5em;
    left: 0.15em;
    position: relative;
    transform: rotate(-45deg);
    vertical-align: middle;
    width: 0.5em;
    left: 0;
    transform: rotate(45deg);
    margin: 0 0.5ch;
    color: #49075e;
}

.satisfaction-value {
    display: flex;
    align-items: center;
    padding: 0.25rem;
    font-weight: bold;
}

.field {
    display: flex;
    justify-content: space-between;
    flex-wrap:wrap;
    padding: 0.5rem;
}

td.value {
    text-align: center;
    font-weight: bold;
}
.positive {
    background-color: #4BB543;
    color: white;
}

.negative {
    background: rgba(171, 39, 45, 0.2);
}

.neutral {
    background: #eee;
}
</style>
