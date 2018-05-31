<template>
        <div class="record">
            <button type="button" :class="visibilityButtonClasses" class="button secondary small expand" @click.prevent="toggleVisibility">{{visibilityButtonText}}</button>
            <div  v-show="visible" class="field" v-for="(field,i) in fields" :key="recordId + i">
                <span class="label">{{ getColumnName(i) }}</span>
                <span class="value">{{field}}</span>
            </div>
        </div>

</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { ResultsEditor as S } from "../store";
import { RecordElement } from "../../../common/Record";

@Component
export default class SwapSuggestionsDisplayRecord extends Vue {
    @Prop recordId = p<RecordElement>({ required: true });
    
    private expanded:boolean = false;

    get visible() {
        return this.expanded;
    }

    set visible(expanded) {
        this.expanded = expanded;
    }

    get recordLookupMap() {
        return S.get(S.getter.GET_RECORD_LOOKUP_MAP) as any;
    }

    get fields() {
        const recordArray = [...this.recordLookupMap.get(this.recordId)];
        // Make id column first index
        const idColumnIndex = this.idColumnIndex;
        if(idColumnIndex === undefined) return [];
        recordArray.splice(idColumnIndex, 1);

        // const idColumn = recordArray.splice(idColumnIndex, 1);
        // recordArray.unshift(idColumn[0]);
        return recordArray;
    }

    get idColumnIndex() {
        const columns = S.state.recordData.columns;
        const idColumnId = S.state.recordData.idColumn!._id;
        const idColumnIndex = columns.findIndex((col) => col._id === idColumnId);
        return idColumnIndex;
    }

    get reorderedColumns() {
        const columns =  [...S.state.recordData.columns];
        const idColumnIndex = this.idColumnIndex;
        if(idColumnIndex === undefined) return [];
        columns.splice(idColumnIndex, 1);
        // const idColumn = columns.splice(idColumnIndex, 1);
        // columns.unshift(idColumn[0]);
        return columns;
    }

    getColumnName(index: number) {
        return this.reorderedColumns[index].label;
    }

    toggleVisibility() {
        this.visible = !this.visible;
    }

    get visibilityButtonText() {
        return this.visible?"Close":"Details";
        
        // return this.visible?"Close":"Expand";
    }

    get visibilityButtonClasses() {
        return {
            "visible": this.visible
        }
    }

}
</script>

<!-- ####################################################################### -->
<style scoped src="../static/results-editor-side-panel.css"></style>
<style scoped>
.record {
    display: flex;
    flex-direction: column;
    overflow: auto;
}

.field {
    display: flex;
    justify-content: space-between;
    flex-wrap:wrap;
    border-top: 0.1em solid rgba(1, 0, 0, 0.1);
}
.value {
    font-weight: bold;
}

.expand {
    background: rgba(255,255,255,0.3);
    align-self: center;
    cursor: pointer;
    padding: 0.1rem;
    font-size: 0.7em;
}

.expand:hover, .expand:active, .expand:focus {
    opacity: 1;
}
.expand::after {
    content: "▼";
    margin: 0 0.5rem;
}

.expand.visible::after {
    content: "▲";
    margin: 0 0.5rem;
}
</style>