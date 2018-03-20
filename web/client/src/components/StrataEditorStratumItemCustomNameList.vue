<template>
    <div>
        <p class="smaller-margins">
            Provide a list of names, one per line:
            <br>
            <div class="custom-list-number-wrapper">

                <div class="row">
                    <textarea v-model="customCounterLineNumbersListNewLine"
                              ref="lineNumberTextArea"
                              rows="5"
                              cols="4"
                              disabled></textarea>
                    <textarea v-model="customCounterList"
                              @scroll="syncLineNumbers"
                              ref="customCounterTextArea"
                              rows="5"></textarea>
                </div>
                <div class="number-teams">
                    <span>{{numberOfCounterCustomList}} </span>
                    <span>{{stratum.label}} name{{numberOfCounterCustomList===1?'':'s'}} entered</span>
                </div>
            </div>
        </p>


        <div v-if="!isCounterCustomListValid"
             class="error-msg">
            <p v-if="doesCounterCustomListContainDuplicates">List contains duplicates which may result in identical names in the final output.</p>
            <p v-if="doesCounterCustomListContainEmptyLines">Warning: Empty lines detected. Please make sure:
                <ul>
                    <li>The list is not empty</li>
                    <li>There are no empty lines in the list.</li>
                </ul>
            </p>
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

    /** Stores the line numbers needed for custom counter list */
    private lineNumbersList: number[] = [];

    get customCounterList() {
        const counterValue = this.stratum.namingConfig.counter;

        if (!Array.isArray(counterValue)) {
            throw new Error("Not custom counter list");
        }

        return counterValue.join("\n");
    }

    set customCounterList(newValue: string) {
        this.syncLineNumbers();
        const customCounterList = newValue.split("\n");
        // Set line numbers list according to the new value of custom counter list
        this.customCounterLineNumbersList = customCounterList.map((_item: any, i: number) => i + 1);
        this.$emit("customNameListChanged", customCounterList);
        
    }

    /**
     * Returns line numbers as a new-line delimited string
     */
    get customCounterLineNumbersListNewLine() {
        return this.customCounterLineNumbersList.join('.\n');
    }

    /**
     * Returns an array of line numbers needed for custom counter list
     */
    get customCounterLineNumbersList() {
        return this.lineNumbersList;
    }

    set customCounterLineNumbersList(list: number[]) {
        this.lineNumbersList = [...list];
    }

    /**
     * Returns the number of names in custom counter list
     */
    get numberOfCounterCustomList() {
        return this.customCounterList.trim().split('\n').filter((item) => item !== '').length;
    }

    get isCounterCustomListValid() {
        return !(
            this.doesCounterCustomListContainDuplicates || this.doesCounterCustomListContainEmptyLines
        );
    }

    get doesCounterCustomListContainDuplicates() {
        const counterValue = this.stratum.namingConfig.counter;

        if (!Array.isArray(counterValue)) {
            throw new Error("Not custom counter list");
        }

        // Check for duplicates in the custom list
        const trimmedCounterStrings = counterValue
            .map(counterString => counterString.trim())
            .filter(counterString => counterString.length !== 0);

        const counterValueSet = new Set(trimmedCounterStrings);

        return counterValueSet.size !== trimmedCounterStrings.length;
    }

    /**
     * Checks if any empty lines exist / list is empty
     */
    get doesCounterCustomListContainEmptyLines() {
        // Check for two successive new line characters
        if (this.customCounterList.indexOf('\n\n') !== -1) {
            return true;
        }

        // Check if empty lines exist
        const emptyLines = this.customCounterList.trim().split('\n').filter((item) => item == '');
        return emptyLines.length > 0;
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

</style>