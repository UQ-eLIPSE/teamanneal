<template>
    <div>
        <p class="smaller-margins">
            Provide a list of names, one per line:
            <br>
            <div class="custom-list-number-wrapper">
                <TextareaWithLineNumbers v-model="nameListInputTextareaValue"></TextareaWithLineNumbers>
                <div class="team-count">
                    <span class="number">{{ numberOfCustomNames }} </span>
                    <span>{{ stratumLabel }} name{{ numberOfCustomNames === 1 ? '' : 's' }} entered</span>
                </div>
            </div>
        </p>

        <div v-if="!isCustomNameListValid"
             class="error-msg">
            <p v-if="doesCustomNameListContainDuplicates">List contains duplicates which may result in identical names in the final output.</p>
            <p v-if="doesCustomNameListContainEmptyLines">Empty lines detected. Please make sure there are no empty lines in the list.</p>
            <p v-if="isCustomNameListEmpty">Name list cannot be empty.</p>
            <p v-if="isCustomNameListInsufficient">There are insufficient names to label every {{ stratumLabel }} uniquely. TeamAnneal will cycle through this list with a number appended if more names are not supplied.</p>
        </div>
        <p class="smaller-margins">
            For example:
            <i>{{ stratumLabel }} {{ randomExampleName }}</i>
        </p>
    </div>
</template>


<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as StratumNamingConfig from "../data/StratumNamingConfig";

import TextareaWithLineNumbers from "./TextareaWithLineNumbers.vue";

@Component({
    components: {
        TextareaWithLineNumbers,
    },
    model: {
        event: "change",
        prop: "names",
    },
})
export default class StrataEditorStratumItemCustomNameList extends Vue {
    /** Label to show that represents the stratum being edited */
    @Prop stratumLabel = p({ type: String, required: true, });

    /** List of names for the custom name list */
    @Prop names = p<ReadonlyArray<string>>({ type: Array, required: false, default: () => [], });

    /** Custom name list minimum expected count threshold */
    @Prop minCount = p({ type: Number, required: false, });

    get nameListInputTextareaValue() {
        return this.names.join("\n");
    }

    set nameListInputTextareaValue(value: string) {
        this.$emit("change", value.split("\n"));
    }

    /** 
     * Returns the number of custom names entered by user
     */
    get numberOfCustomNames() {
        return this.names.filter(name => name.trim() !== '').length;
    }

    get isCustomNameListValid() {
        return !(
            this.doesCustomNameListContainDuplicates ||
            this.doesCustomNameListContainEmptyLines ||
            this.isCustomNameListEmpty ||
            this.isCustomNameListInsufficient
        );
    }

    /**
     * Checks if custom counter name list is empty
     */
    get isCustomNameListEmpty() {
        return this.numberOfCustomNames === 0;
    }

    /**
     * Returns whether the name list is not long enough for the minimum count
     */
    get isCustomNameListInsufficient() {
        if (this.minCount === undefined) {
            return true;
        }

        return this.numberOfCustomNames < this.minCount;
    }

    get doesCustomNameListContainDuplicates() {
        // Check for duplicates in the custom list
        const trimmedCounterStrings = this.names
            .map(counterString => counterString.trim())
            .filter(counterString => counterString.length !== 0);

        const counterValueSet = new Set(trimmedCounterStrings);

        return counterValueSet.size !== trimmedCounterStrings.length;
    }

    /**
     * Checks if any empty lines exist
     */
    get doesCustomNameListContainEmptyLines() {
        return this.names
            .some((name, i, nameArray) => {
                // Ignore the last line which we permit to be empty
                if (i === nameArray.length - 1) {
                    return false;
                }

                // If the line when trimmed is length 0, it is considered empty
                return name.trim().length === 0;
            });
    }

    get randomExampleName() {
        return StratumNamingConfig.generateRandomExampleNameStringArray(this.names);
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
