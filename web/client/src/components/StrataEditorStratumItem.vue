<template>
    <div>
        <div>
            <span class="stratum-label">{{ stratum.label }}</span>
        </div>
        <div v-if="!isPartition"
             class="stratum-config">
            <div class="stratum-size">
                <h3>Size
                    <span class="size-unit-text">({{ pluralChildUnitTextFirstCharCapitalised }} per {{ stratum.label }})</span>
                </h3>
                <div class="size-block">
                    <div class="three-sizes">
                        <label :class="stratumSizeMinClasses">
                            <div>Min</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        v-model="stratumSizeMin"></DynamicWidthInputField>
                            </span>
                        </label>
                        <label :class="stratumSizeIdealClasses">
                            <div>Ideal</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        v-model="stratumSizeIdeal"></DynamicWidthInputField>
                            </span>
                        </label>
                        <label :class="stratumSizeMaxClasses">
                            <div>Max</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        v-model="stratumSizeMax"></DynamicWidthInputField>
                            </span>
                        </label>
                    </div>
                    <ul v-if="stratumSizeErrors.length > 0"
                        class="stratum-size-errors">
                        <li v-for="msg in stratumSizeErrors"
                            :key="msg">{{ msg }}</li>
                    </ul>
                </div>
                <template v-if="stratumSizeErrors.length === 0">
                    <h3>{{ stratum.label }} distribution</h3>
                    <ul class="distribution">
                        <li v-for="groupSizeInfo in stratumGroupSizes"
                            :key="groupSizeInfo.size">
                            {{ groupSizeInfo.count }}
                            <template v-if="groupSizeInfo.count === 1">{{ stratum.label }}</template>
                            <template v-else>{{ stratum.label }}s</template> with {{ groupSizeInfo.size }} {{ pluralChildUnitText }}
                        </li>
                    </ul>
                </template>
            </div>
            <div class="stratum-name">
                <h3>Name</h3>
                <h4 class="smaller-margins">Format</h4>
                <p class="smaller-margins">
                    <select v-model="counterType">
                        <option v-for="counterOption in counterList"
                                :key="counterOption.value"
                                :value="counterOption.value">{{ counterOption.text }}</option>
                    </select>
                </p>
                <p v-if="isCounterCustomList"
                   class="smaller-margins">
                    Provide a list of names, one per line:
                    <br>
                    <div class="custom-list-number-wrapper"
                         v-if="isCounterCustomList">

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

                <div v-if="isCounterCustomList && !isCounterCustomListValid"
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


                <template v-if="showNamingContextOptions">
                    <h4 class="smaller-margins">Context</h4>
                    <p class="smaller-margins">
                        Make {{ stratum.label }} names unique:
                        <br>
                        <select v-model="namingContext">
                            <option v-for="namingContextOption in namingContextOptionList"
                                    :key="namingContextOption.value"
                                    :value="namingContextOption.value">{{ namingContextOption.text }}</option>
                        </select>
                    </p>
                </template>
            </div>
        </div>
        <div v-else
             class="stratum-config">
            <div>
                <i>You cannot configure the size or names of partitions.</i>
            </div>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { parseUint32 } from "../util/Number";
import { deepCopy, deepMerge } from "../util/Object";

import { Stratum, Data as IStratum } from "../data/Stratum";
import { MinimalDescriptor as IColumnData_MinimalDescriptor } from "../data/ColumnData";
import * as ListCounter from "../data/ListCounter";

import DynamicWidthInputField from "./DynamicWidthInputField.vue";

const CounterList = ((): ReadonlyArray<{ value: string, text: string, }> => {
    const list: { value: string, text: string, }[] =
        ListCounter.SupportedListCounters.map(counter => {
            return {
                value: counter.type,
                text: counter.example,
            }
        });

    // Add "custom" entry
    list.push({
        value: "custom",
        text: "[Custom list]",
    });

    return list;
})();

@Component({
    components: {
        DynamicWidthInputField,
    },
})
export default class StrataEditorStratumItem extends Vue {
    // Props
    @Prop stratum = p<IStratum>({ required: true, });
    @Prop childUnit = p({ type: String, required: true, });
    @Prop groupSizes = p<{ [groupSize: number]: number }>({ required: false, });
    @Prop isPartition = p({ type: Boolean, required: false, default: false, });
    @Prop partitionColumnData = p<IColumnData_MinimalDescriptor | undefined>({ required: false, default: undefined, });
    @Prop namingContexts = p<ReadonlyArray<IStratum>>({ type: Array, required: false, default: () => [], });

    /** Stores the line numbers needed for custom counter list */
    private lineNumbersList: number[] = [];

    get childUnitText() {
        return this.childUnit || "<group>";
    }

    get pluralChildUnitText() {
        if (this.childUnitText === "person") {
            return "people";
        }
        return this.childUnitText + "s";
    }

    get pluralChildUnitTextFirstCharCapitalised() {
        const text = this.pluralChildUnitText;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    get randomExampleName() {
        return Stratum.GenerateRandomExampleName(this.stratum);
    }

    get counterList() {
        return CounterList;
    }

    get stratumSizeMinClasses() {
        const classes = {
            "invalid-size": (
                Stratum.IsSizeMinNotUint32(this.stratum) ||
                Stratum.IsSizeMinGreaterThanIdeal(this.stratum) ||
                Stratum.IsSizeMinEqualToMax(this.stratum) ||
                Stratum.IsSizeMinLessThanOne(this.stratum)
            ),
        }

        return classes;
    }

    get stratumSizeIdealClasses() {
        const classes = {
            "invalid-size": (
                Stratum.IsSizeIdealNotUint32(this.stratum) ||
                Stratum.IsSizeMinGreaterThanIdeal(this.stratum) ||
                Stratum.IsSizeIdealGreaterThanMax(this.stratum)
            ),
        }

        return classes;
    }

    get stratumSizeMaxClasses() {
        const classes = {
            "invalid-size": (
                Stratum.IsSizeMaxNotUint32(this.stratum) ||
                Stratum.IsSizeIdealGreaterThanMax(this.stratum) ||
                Stratum.IsSizeMinEqualToMax(this.stratum)
            ),
        }

        return classes;
    }

    get stratumSizeErrors() {
        const errMsgs: string[] = [];
        const stratum = this.stratum;

        /**
         * Runs error check functions, and if true, adds error message to array
         */
        const errCheck =
            (func: (stratum: IStratum) => boolean, msg: string) =>
                func(stratum) && errMsgs.push(msg);


        // Run checks
        errCheck(Stratum.IsSizeMinNotUint32, "Min size is not an integer");
        errCheck(Stratum.IsSizeIdealNotUint32, "Ideal size is not an integer");
        errCheck(Stratum.IsSizeMaxNotUint32, "Max size is not an integer");

        errCheck(Stratum.IsSizeMinGreaterThanIdeal, "Min size cannot be greater than ideal size");
        errCheck(Stratum.IsSizeIdealGreaterThanMax, "Ideal size cannot be greater than max size");

        errCheck(Stratum.IsSizeMinEqualToMax, "Min size cannot be equal to max size");

        errCheck(Stratum.IsSizeMinLessThanOne, "Min size cannot be less than 1");

        // If `groupSizes` is undefined, then the group size calculation failed
        // to produce a valid set of groups
        if (this.groupSizes === undefined) {
            errMsgs.push("Group sizes cannot be met");
        }

        // Return array of error messages
        return errMsgs;
    }

    get counterType() {
        const counter = this.stratum.namingConfig.counter;

        if (Array.isArray(counter)) {
            return "custom";
        } else {
            return counter as string;
        }
    }

    set counterType(newValue: string) {
        const oldCounterValue = this.stratum.namingConfig.counter;

        if (newValue === "custom") {
            // If already a custom array, do nothing
            if (Array.isArray(oldCounterValue)) {
                return;
            }

            // Otherwise set the counter to a default array
            this.updateStratum({
                namingConfig: {// Default custom list is "Red", "Green", "Blue"
                    counter: ["Red", "Green", "Blue"],
                }
            });
        } else {
            this.updateStratum({
                namingConfig: {
                    counter: newValue,
                }
            });
        }
    }

    get isCounterCustomList() {
        return Array.isArray(this.stratum.namingConfig.counter);
    }

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
        this.customCounterLineNumbersList = customCounterList.map((item: any, i: number) => i + 1);

        this.updateStratum({
            namingConfig: {
                counter: customCounterList,
            }
        });
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
        if (this.isCounterCustomList) {
            return this.customCounterList.trim().split('\n').filter((item) => item !== '').length;
        }
        return '-';
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

    get namingContext() {
        return this.stratum.namingConfig.context;
    }

    set namingContext(newValue: string) {
        this.updateStratum({
            namingConfig: {
                context: newValue,
            },
        });
    }

    get namingContextOptionList() {
        const list = this.namingContexts.map((stratum) => {
            return {
                value: stratum._id,
                text: `per ${stratum.label}`,
            };
        });

        // Add partition option where set
        if (this.partitionColumnData !== undefined) {
            list.unshift({
                value: "_PARTITION",
                text: `per partition (${this.partitionColumnData.label})`,
            });
        }

        // Global is always available
        list.unshift({
            value: "_GLOBAL",
            text: "globally",
        });

        return list;
    }

    get showNamingContextOptions() {
        return this.namingContextOptionList.length > 1;
    }

    async updateStratum(diff: any) {
        // Deep copy and merge in diff
        const newStratum = deepMerge(deepCopy(this.stratum), diff);

        await this.$store.dispatch("upsertStratum", newStratum);
    }

    get stratumSizeMin() {
        return this.stratum.size.min;
    }

    set stratumSizeMin(newValue: any) {
        this.updateStratum({
            size: {
                min: parseUint32(newValue, this.stratumSizeMin),
            },
        });
    }

    get stratumSizeIdeal() {
        return this.stratum.size.ideal;
    }

    set stratumSizeIdeal(newValue: any) {
        this.updateStratum({
            size: {
                ideal: parseUint32(newValue, this.stratumSizeIdeal),
            },
        });
    }

    get stratumSizeMax() {
        return this.stratum.size.max;
    }

    set stratumSizeMax(newValue: any) {
        this.updateStratum({
            size: {
                max: parseUint32(newValue, this.stratumSizeMax),
            },
        });
    }

    get stratumGroupSizes() {
        // Convert all group size keys into numbers
        const groupSizes = this.groupSizes;
        const groupSizeKeys = Object.keys(groupSizes).map(x => +x);

        if (groupSizes === undefined) {
            throw new Error("Group sizes do not exist");
        }

        // Produce group size ordered array with the count for each group size
        return groupSizeKeys.sort().map((size) => {
            const count = groupSizes[size];

            return {
                size,
                count,
            }
        });
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

<!-- ####################################################################### -->

<style scoped>
h3.smaller-margins,
h4.smaller-margins,
p.smaller-margins {
    margin: 0.5em 0;
}

p+h3.smaller-margins,
p+h4.smaller-margins {
    margin-top: 1em;
}

.input {
    background: none;

    border: 0;
    border-bottom: 0.1em dotted;

    color: #49075E;

    cursor: pointer;
}

.stratum-label {
    display: inline-block;
    background: #49075E;
    padding: 0.3em 0.7em;
    border-radius: 0.3em;

    font-size: 1.5em;
    color: #fff;
}

.stratum-config {
    display: inline-flex;
    flex-direction: row;

    justify-content: flex-start;
    align-items: flex-start;

    margin-left: 1.5em;
}

.stratum-config h3 {
    margin: 0.5em 0;
    color: #49075E;
    font-weight: 500;
}

.stratum-config h3:first-child {
    margin-top: 0;
}

.stratum-config>div {
    flex-grow: 1;
    margin: 1rem;
}

.size-block {
    display: inline-block;
    position: relative;

    width: 15em;
    text-align: center;
}

.three-sizes {
    display: flex;
    flex-direction: row;

    justify-content: space-between;
}

.three-sizes>label {
    padding: 0.3em;
    background: rgba(0, 0, 0, 0.05);

    flex-grow: 0;
    flex-shrink: 0;

    width: 30%;

    cursor: pointer;
}

.three-sizes>label.invalid-size {
    background: rgba(255, 140, 0, 0.7);
}

.three-sizes .input-area {
    font-size: 1.5em;

    display: inline-block;
}

.size-unit-text {
    font-size: 0.8em;
    font-style: italic;
    font-weight: 300;
}

ul.stratum-size-errors {
    background: rgba(255, 140, 0, 0.7);

    font-size: 0.8em;
    text-align: left;
    margin: 0.5em 0;

    padding-top: 0.5em;
    padding-bottom: 0.5em;
    padding-right: 0.2em;

    list-style: disc outside;
}

ul.distribution {
    padding: 0;
    padding-left: 1.5em;
}


/* Custom name list */

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

.custom-list-number-wrapper>.number-teams {
    padding: 0.5em;
    border-top: 0.5px solid rgba(1, 0, 0, 0.1);
    background-color: white;
}

.number-teams>span:first-child {
    color: #49075e;
    font-weight: 500;
}

.custom-list-number-wrapper>.row>textarea {
    border: 0;
    padding: 0.4em 0.2em;
}

.custom-list-number-wrapper>.row>textarea:first-child {
    background-color: #fff;
    color: #aaa;
    text-align: right;
    overflow: hidden;
    resize: none;
    cursor: default;
    border-right: 0.2em solid #aaa;
}

.row {
    display: flex;
}
</style>
