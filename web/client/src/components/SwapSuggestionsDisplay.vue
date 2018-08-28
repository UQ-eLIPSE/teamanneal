<template>
  <div v-if="sortedTestPermutationData !== undefined && data.cursor === 'personB'" class="test-permutations">
    <h5>Suggestions</h5>
    <ul class="suggestions">
      <li class="suggestion header">
        <div class="ancestors">Swap with ...</div>
        <div class="satisfaction-value">Overall constraints satisfaction</div>
      </li>

      <li v-for="x in sortedTestPermutationData" class="suggestion" :key="x.nodeB + x.recordIdB" @click="personBSelected(x.nodeB, x.recordIdB)">
        <div class="ancestors">
          <span class="id-value" :title="getIdValue(x.recordIdB)">{{ getIdValue(x.recordIdB) }}</span>
          in
          <span :title="getAncestors(x.nodeB).join(' > ')" v-for="ancestor in getAncestors(x.nodeB)" :key="ancestor">{{ancestor}}</span>
          <SwapSuggestionsDisplayRecord class="record-details" :recordId="x.recordIdB"></SwapSuggestionsDisplayRecord>

        </div>
        <div :class="getSatisfactionChangeClass(x.satisfaction.value)" class="satisfaction-value">
          <span>{{getSatisfactionPercentChangeFormatted(x.satisfaction.value)}}</span>
        </div>

      </li>
    </ul>
    <button class="button secondary small" @click="clearSatisfactionTestPermutationData">Close suggestions</button>
  </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { SwapRecordsTestPermutationOperationResult } from "../../../common/ToClientSatisfactionTestPermutationResponse";
import { Suggestions } from "../data/Suggestions";
import { ResultsEditor as S } from "../store";
import { SwapSidePanelToolData } from "../data/SwapSidePanelToolData";
import SwapSuggestionsDisplayRecord from "./SwapSuggestionsDisplayRecord.vue";
import { RecordElement, Record } from "../../../common/Record";

@Component({
  components: {
    SwapSuggestionsDisplayRecord
  }
})
export default class SwapSuggestionsDisplay extends Vue {
  @Prop sortedTestPermutationData = p<SwapRecordsTestPermutationOperationResult>({ required: true });
  @Prop data = p<SwapSidePanelToolData>({ required: true });

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

    const satisfactionObject = sortedTestPermutationData.find(p => p.nodeB === selectedNodeId);

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
    // Find the % change in overall satisfaction value between the old(current config) and the new (would-be) configuration
    const percentChange = (satisfactionValue - satisfactionObject.value) / satisfactionObject.max * 100;

    return percentChange;
  }

  getSatisfactionPercentChangeFormatted(satisfactionValue: number) {
    const percentChange = this.getSatisfactionPercentChange(satisfactionValue);
    if (percentChange === undefined) return;

    const formatted = percentChange.toFixed(2);

    if (percentChange > 0) {
      return "+" + formatted + "%";
    } else if (percentChange === 0) {
      return "No change";
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
    } else if (percentChange === 0) {
      classes.push("neutral");
    }

    return classes;
  }

  get idColumnIndex() {
    const columns = S.state.recordData.source.columns;
    const idColumnId = S.state.recordData.idColumn!._id;
    const idColumnIndex = columns.findIndex(col => col._id === idColumnId);
    return idColumnIndex;
  }

  get idColumnName() {
    return S.state.recordData.idColumn!.label;
  }

  getIdValue(recordId: RecordElement) {
    const idColumnIndex = this.idColumnIndex;
    const record = this.recordLookupMap.get(recordId);
    if (idColumnIndex === undefined || record === undefined) return "";
    
    return record[idColumnIndex];
  }

  get recordLookupMap() {
    return S.get(S.getter.GET_RECORD_LOOKUP_MAP) as Map<RecordElement, Record>;;
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
  position: relative;
}

.test-permutations > h5 {
  color: #49075e;
  margin: 0.25rem 0.5rem;
}

.suggestions {
  list-style-type: none;
  padding: 0;
  margin: 0;
  height: 100%;
  overflow: auto;
}

.suggestion {
  display: flex;
  background-color: #ffffff;
  border: none;
  outline: 0.1em solid rgba(1, 0, 0, 0.1);
  cursor: pointer;
  margin: 0.25rem;
  font-size: 0.9em;
}

.suggestion.header {
  cursor: default;
  position: sticky;
  top: 0;
}

.suggestion:hover {
  background-color: rgb(240, 240, 240);
}

.suggestion.header > * {
  background-color: #49075e;
  color: white;
  padding: 0.5rem;
  font-weight: bold;
  border-left: 0.05em solid rgba(255, 255, 255, 0.3);
}

.ancestors {
  padding: 0.5rem;
  width: 75%;
}

.ancestors > * {
  display: inline-block;
}

.ancestors > span:nth-child(n + 3)::before {
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

.ancestors .id-value {
  display: block;
  font-size: 1.1em;
  font-weight: bold;
}

.satisfaction-value {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  font-weight: bold;
  width: 25%;
}

.positive {
  background-color: #4bb543;
  color: white;
}

.negative {
  background: rgba(171, 39, 45, 0.2);
}

.neutral {
  background: #eee;
}

.record-details > button {
  align-self: baseline;
}
</style>
