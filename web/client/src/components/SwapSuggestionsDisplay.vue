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
                    <div class="field">
                        <span class="label">Satisfaction: </span>
                        <span class="value">{{ getSatisfactionPercentChangeFormatted(x.satisfaction.value)}}</span>
                    </div>
                    <div class="record">
                        <div class="field">
                            <span class="label">{{ idColumnName }}: </span>
                            <span class="value">{{ getIdValue(x.recordIdB) }}</span>
                        </div>
                        <SwapSuggestionsDisplayRecord :recordId="x.recordIdB"></SwapSuggestionsDisplayRecord>
                    </div>
                </div>
            </li>
        </ul>
        <button class="button secondary small"
                @click="clearSatisfactionTestPermutationData">Close suggestions</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p, Lifecycle } from "av-ts";
import { SwapRecordsTestPermutationOperationResult } from "../../../common/ToClientSatisfactionTestPermutationResponse";
import { Suggestions } from "../data/Suggestions";
import { ResultsEditor as S } from "../store";
import SwapSuggestionsDisplayRecord from "./SwapSuggestionsDisplayRecord.vue";

@Component({
    components: {
        SwapSuggestionsDisplayRecord
    }
})
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

    get idColumnIndex() {
        const columns = S.state.recordData.columns;
        const idColumnId = S.state.recordData.idColumn!._id;
        const idColumnIndex = columns.findIndex((col) => col._id === idColumnId);
        return idColumnIndex;
    }
    

    get idColumnName() {
        return S.state.recordData.idColumn!.label;
    }

    getIdValue(recordId: any) {
        const idColumnIndex = this.idColumnIndex;
        if(idColumnIndex === undefined) return "";
        return this.recordLookupMap.get(recordId)[idColumnIndex];
    }

    get recordLookupMap() {
        
        return S.get(S.getter.GET_RECORD_LOOKUP_MAP) as any;
    }

    @Lifecycle 
    created() {
    }



}
</script>

<!-- ####################################################################### -->

<style scoped src="../static/results-editor-side-panel.css"></style>

<style scoped>
.test-permutations {
    background: rgba(220, 220, 220, 1);
    padding: 0 0.5rem;
    height: 60%;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
}

.test-permutations>h5 {
    color: #49075E;
    /* font-style: italic; */
    margin: 0.25rem;
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
    position: relative;
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

.suggestion .content {
    padding: 0.5rem;
}

.positive {
    background: rgba(53, 146, 56, 0.2);
}

.negative {
    background: rgba(171, 39, 45, 0.2);
}

.record {
    display: flex;
    flex-direction: column;
    overflow: auto;
}

.field {
    display: flex;
    justify-content: space-between;
    flex-wrap:wrap;
    padding: 0.2rem 0;
}

.value {
    font-weight: bold;
}

.neutral {
    background: #eee;
}

</style>
