<template>
    <div class="record">
        <button type="button" class="button secondary small expand" @click.prevent="toggleVisibility">{{visibilityButtonText}}</button>
        <div v-show="visible" class="modal">
          
            <div class="field" v-for="(field,i) in fields" :key="recordId + i">
                <span class="label">{{ columns[i].label }}</span>
                <span class="value">{{field}}</span>
            </div>
        </div>
    </div>

</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { ResultsEditor as S } from "../store";
import { RecordElement, Record } from "../../../common/Record";

@Component
export default class SwapSuggestionsDisplayRecord extends Vue {
  @Prop recordId = p<RecordElement>({ required: true });

  private expanded: boolean = false;
  get visible() {
    return this.expanded;
  }

  set visible(expanded) {
    this.expanded = expanded;
  }

  get recordLookupMap() {
    return S.get(S.getter.GET_RECORD_LOOKUP_MAP) as Map<RecordElement, Record>;
  }

  get fields() {
    return this.recordLookupMap.get(this.recordId);
  }

  get idColumnIndex() {
    const columns = S.state.recordData.source.columns;
    const idColumnId = S.state.recordData.idColumn!._id;
    const idColumnIndex = columns.findIndex(col => col._id === idColumnId);
    return idColumnIndex;
  }

  get columns() {
    return S.state.recordData.source.columns;
  }

  toggleVisibility() {
    this.visible = !this.visible;
  }

  get visibilityButtonText() {
    return this.visible ? "Close" : "Details";
  }
}
</script>

<!-- ####################################################################### -->
<style scoped src="../static/results-editor-side-panel.css"></style>
<style scoped>
.record {
  display: flex;
  position: static;
  flex-direction: column;
  overflow: auto;
}

.modal {
  padding: 0.5rem;
  background-color: white;
}

.field {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  border-top: 0.1em solid rgba(1, 0, 0, 0.1);
}
.value {
  font-weight: bold;
}

.expand {
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  padding: 0;
  font-size: 0.7em;
  border: none;
  align-self: flex-end;
  text-decoration: underline;
}

.expand:hover,
.expand:active,
.expand:focus {
  opacity: 1;
}
</style>