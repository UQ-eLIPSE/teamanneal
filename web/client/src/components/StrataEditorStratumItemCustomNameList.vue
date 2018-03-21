<template>
    <div>
        <p class="smaller-margins">
            Provide a list of names, one per line:
            <br>
            <div class="custom-list-number-wrapper">

                <div class="text-areas">
                    <textarea v-model="customCounterLineNumbers"
                              class="line-numbers-text-area"
                              ref="lineNumberTextArea"
                              cols="4"
                              disabled></textarea>
                    <textarea v-model="customCounterList"
                              @scroll="syncLineNumbers"
                              class="custom-counter-text-area"
                              ref="customCounterTextArea"
                              rows="12"
                              cols="60"></textarea>
                </div>
                <div class="team-count">
                    <span class="number">{{numberOfCustomNames}} </span>
                    <span>{{stratum.label}} name{{numberOfCustomNames===1?'':'s'}} entered</span>
                </div>
            </div>
        </p>


        <div v-if="!isCounterCustomListValid"
             class="error-msg">
            <p v-if="doesCounterCustomListContainDuplicates">List contains duplicates which may result in identical names in the final output.</p>
            <p v-if="doesCounterCustomListContainEmptyLines">Warning: Empty lines detected. Please make sure there are no empty lines in the list.</p>
            <p v-if="isCounterCustomListEmpty">Warning: Name list cannot be empty.</p>
        </div>
        <p class="smaller-margins">
            For example:
            <i>{{ stratum.label }} {{ randomExampleName }}</i>
        </p>

    </div>
</template>


<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { Stratum, Data as IStratum } from "../data/Stratum";

@Component
export default class StrataEditorStratumItemCustomNameList extends Vue {
    @Prop stratum = p<IStratum>({ required: true, });

    /** Returns array of custom names */
    get counter() {
        return this.stratum.namingConfig.counter;
    }

    /** 
     * Returns list of custom names
     */
    get customCounterList() {
        if (!Array.isArray(this.counter)) {
            throw new Error("Not custom counter list");
        }

        return this.counter.join("\n");
    }

    set customCounterList(newValue: string) {
        this.syncLineNumbers();
        this.$emit("customNameListChanged", newValue.split("\n"));
    }

    /**
     * Returns line numbers as a new-line delimited string
     */
    get customCounterLineNumbers() {
        return this.customCounterList.split("\n").map((_item: any, i: number) => i + 1).join("\n");
    }

    /** 
     * Returns the number of custom names entered by user
     */
    get numberOfCustomNames() {
        return (this.counter as string[]).filter((name: string) => name.trim() !== '').length;
    }

    get isCounterCustomListValid() {
        return !(
            this.doesCounterCustomListContainDuplicates ||
            this.doesCounterCustomListContainEmptyLines ||
            this.isCounterCustomListEmpty
        );
    }

    /**
     * Checks if custom counter name list is empty
     */
    get isCounterCustomListEmpty() {
        return this.numberOfCustomNames === 0;
    }

    get doesCounterCustomListContainDuplicates() {
        if (!Array.isArray(this.counter)) {
            throw new Error("Not custom counter list");
        }

        // Check for duplicates in the custom list
        const trimmedCounterStrings = this.counter
            .map(counterString => counterString.trim())
            .filter(counterString => counterString.length !== 0);

        const counterValueSet = new Set(trimmedCounterStrings);

        return counterValueSet.size !== trimmedCounterStrings.length;
    }

    /**
     * Checks if any empty lines exist
     */
    get doesCounterCustomListContainEmptyLines() {
        if (Array.isArray(this.counter)) {
            const emptyValue = this.counter
                .find((counterItem: string, i: number) => counterItem.trim().length === 0 && i < this.counter.length - 1);
            if (emptyValue !== undefined) return true;
        }
        return false;
    }

    get randomExampleName() {
        return Stratum.GenerateRandomExampleName(this.stratum);
    }


    /**
    * Synchronises scrolling between line numbers and custom counter list text area
    */
    syncLineNumbers() {
        const source = this.$refs['customCounterTextArea'] as HTMLTextAreaElement;
        const lineNumberTextArea = this.$refs['lineNumberTextArea'] as HTMLTextAreaElement;
        lineNumberTextArea.scrollTop = source.scrollTop;
    }

}
</script>


<style scoped>

.error-msg>p {
    font-size: 0.9em;
    background: darkorange;
    padding: 1rem;
}

.custom-list-number-wrapper {
    display: inline-flex;
    flex-direction: column;
    border: 0.5px solid rgba(1, 0, 0, 0.1);
    padding: 0.2em;
    background-color: #fff;
    border-radius: 0.1em;
}

.text-areas {
    display: flex;
}

textarea {
    border: 0;
    padding: 0.4em 0.2em;
    border-bottom: 0.5px solid rgba(1, 0, 0, 0.1);
    font-family: inherit;
    font-size: 1.2em;
}


.line-numbers-text-area {
    background: rgba(73, 7, 94, 0.04);
    color: #49075e;
    text-align: right;
    overflow: hidden;
    resize: none;
    cursor: default;
    border-right: 0.2em solid #aaa;
}

.custom-counter-text-area {
    resize: none;
    white-space: nowrap;
    overflow: auto;
    outline: none;
}

.custom-counter-text-area:active,
.custom-counter-text-area:focus {
    outline: 0.2em solid rgba(73, 7, 94, 0.2);
}

.team-count {
    padding: 0.5em;
    background-color: white;
    align-self: flex-end;
    margin-top: 0.1rem;
}

.team-count>.number {
    color: #49075e;
    font-weight: 500;
}
</style>