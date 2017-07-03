<template>
    <div>
        <div>
            <span class="stratum-label">{{ stratum.label }}</span>
        </div>
        <div v-if="!isPartition"
             class="stratum-config">
            <div class="stratum-size">
                <h3>Size
                    <span class="size-unit-text">({{ pluralChildUnitText }} per {{ stratum.label }})</span>
                </h3>
                <div class="size-block">
                    <div class="three-sizes">
                        <label :class="stratumSizeMinClasses">
                            <div>Min</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        :val="''+stratum.size.min"
                                                        @change="onMinValueChange"></DynamicWidthInputField>
                            </span>
                        </label>
                        <label :class="stratumSizeIdealClasses">
                            <div>Ideal</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        :val="''+stratum.size.ideal"
                                                        @change="onIdealValueChange"></DynamicWidthInputField>
                            </span>
                        </label>
                        <label :class="stratumSizeMaxClasses">
                            <div>Max</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        :val="''+stratum.size.max"
                                                        @change="onMaxValueChange"></DynamicWidthInputField>
                            </span>
                        </label>
                    </div>
                    <ul v-if="stratumSizeErrors.length > 0"
                        class="stratum-size-errors">
                        <li v-for="msg in stratumSizeErrors"
                            :key="msg">{{ msg }}</li>
                    </ul>
                </div>
            </div>
            <div class="stratum-name">
                <h3>Name</h3>
                <div>
                    <select :value="counterSelectValue"
                            @change="onCounterSelectChange">
                        <option v-for="counterOption in counterList"
                                :key="counterOption.value"
                                :value="counterOption.value">{{ counterOption.text }}</option>
                    </select>
                </div>
                <p v-if="isCounterCustomList">
                    Provide a list of names, one per line:
                    <br>
                    <textarea v-model="customCounterList"
                              rows="5"></textarea>
                </p>
                <div v-if="isCounterCustomList && !isCounterCustomListValid"
                     class="error-msg">
                    <p v-if="doesCounterCustomListContainDuplicates">List contains duplicates which may result in identical names in the final output.</p>
                </div>
                <p>
                    For example:
                    <i>{{ stratum.label }} {{ randomExampleName }}</i>
                </p>
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

import DynamicWidthInputField from "./DynamicWidthInputField.vue";
import * as Stratum from "../data/Stratum";
import * as ListCounter from "../data/ListCounter";

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
    @Prop stratum: Stratum.Stratum = p({ type: Object, required: true, }) as any;
    @Prop childUnit: string = p({ type: String, required: true, }) as any;
    @Prop isPartition: boolean = p({ type: Boolean, required: false, default: false, }) as any;

    onLabelValueChange(newValue: string) {
        this.emitChange({
            label: newValue,
        });
    }

    onMinValueChange(newValue: string) {
        this.emitChange({
            size: {
                min: +newValue || 0,        // Convert to number
                ideal: this.stratum.size.ideal,
                max: this.stratum.size.max,
            }
        });
    }

    onIdealValueChange(newValue: string) {
        this.emitChange({
            size: {
                min: this.stratum.size.min,
                ideal: +newValue || 0,      // Convert to number
                max: this.stratum.size.max,
            }
        });
    }

    onMaxValueChange(newValue: string) {
        this.emitChange({
            size: {
                min: this.stratum.size.min,
                ideal: this.stratum.size.ideal,
                max: +newValue || 0,        // Convert to number
            }
        });
    }

    onCounterSelectChange($event: Event) {
        const el = $event.target as HTMLSelectElement;

        const counterType = el.value;

        if (counterType === "custom") {
            return this.emitChange({
                // Default custom list is "Red", "Green", "Blue"
                counter: ["Red", "Green", "Blue"],
            });
        } else {
            return this.emitChange({
                counter: counterType as any,
            });
        }
    }

    get childUnitText() {
        return this.childUnit || "<group>";
    }

    get pluralChildUnitText() {
        if (this.childUnitText === "person") {
            return "People";
        }
        return this.childUnitText + "s";
    }

    get randomExampleName() {
        const counter = this.stratum.counter;

        // Generate a random value for an example name
        // Random index is up to the 20th index
        if (Array.isArray(counter)) {
            const counterArray = counter
                .map(counterString => counterString.trim())
                .filter(counterString => counterString.length !== 0);

            const randomIndex = (Math.random() * (Math.min(20, counterArray.length))) >>> 0;
            return counterArray[randomIndex];
        } else {
            const listCounters = ListCounter.SupportedListCounters;
            const counterDesc = listCounters.find(x => x.type === counter);

            if (counterDesc === undefined) {
                throw new Error(`Counter "${counter}" not supported`);
            }

            // Generate sequence of 20 elements, and pick a random one from that
            const randomIndex = ((Math.random() * 20) >>> 0);
            return counterDesc.generator(20)[randomIndex];
        }
    }

    get counterList() {
        return CounterList;
    }

    get stratumSizeMinClasses() {
        const classes = {
            "invalid-size": (
                Stratum.isSizeMinNotUint32(this.stratum) ||
                Stratum.isSizeMinGreaterThanIdeal(this.stratum) ||
                Stratum.isSizeMinEqualToMax(this.stratum) ||
                Stratum.isSizeMinLessThanOne(this.stratum)
            ),
        }

        return classes;
    }

    get stratumSizeIdealClasses() {
        const classes = {
            "invalid-size": (
                Stratum.isSizeIdealNotUint32(this.stratum) ||
                Stratum.isSizeMinGreaterThanIdeal(this.stratum) ||
                Stratum.isSizeIdealGreaterThanMax(this.stratum)
            ),
        }

        return classes;
    }

    get stratumSizeMaxClasses() {
        const classes = {
            "invalid-size": (
                Stratum.isSizeMaxNotUint32(this.stratum) ||
                Stratum.isSizeIdealGreaterThanMax(this.stratum) ||
                Stratum.isSizeMinEqualToMax(this.stratum)
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
            (func: (stratum: Stratum.Stratum) => boolean, msg: string) =>
                func(stratum) && errMsgs.push(msg);


        // Run checks
        errCheck(Stratum.isSizeMinNotUint32, "Min size is not an integer");
        errCheck(Stratum.isSizeIdealNotUint32, "Ideal size is not an integer");
        errCheck(Stratum.isSizeMaxNotUint32, "Max size is not an integer");

        errCheck(Stratum.isSizeMinGreaterThanIdeal, "Min size cannot be greater than ideal size");
        errCheck(Stratum.isSizeIdealGreaterThanMax, "Ideal size cannot be greater than max size");

        errCheck(Stratum.isSizeMinEqualToMax, "Min size cannot be equal to max size");

        errCheck(Stratum.isSizeMinLessThanOne, "Min size cannot be less than 1");


        // Return array of error messages
        return errMsgs;
    }

    get counterSelectValue() {
        const counterValue = this.stratum.counter;

        if (Array.isArray(counterValue)) {
            return "custom";
        } else {
            return counterValue;
        }
    }

    get isCounterCustomList() {
        return Array.isArray(this.stratum.counter);
    }

    get customCounterList() {
        const counterValue = this.stratum.counter;

        if (!Array.isArray(counterValue)) {
            throw new Error("Not custom counter list");
        }

        return counterValue.join("\n");
    }

    set customCounterList(newValue: string) {
        const customCounterList = newValue.split("\n");

        this.emitChange({
            counter: customCounterList,
        });
    }

    get isCounterCustomListValid() {
        return !(
            this.doesCounterCustomListContainDuplicates
        );
    }

    get doesCounterCustomListContainDuplicates() {
        const counterValue = this.stratum.counter;

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

    emitChange(diff: Partial<Stratum.Stratum>) {
        // Get current stratum object
        const _: Stratum.Stratum = this.stratum;

        // Copy out stratum
        const stratum: Stratum.Stratum = {
            _id: _._id,
            label: _.label,
            size: {
                min: _.size.min,
                ideal: _.size.ideal,
                max: _.size.max,
            },
            counter: _.counter,
        }

        // Apply diff
        Object.assign(stratum, diff);

        // Emit change event
        const stratumUpdate: Stratum.Update = {
            stratum,
        }

        this.$emit("change", stratumUpdate);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.input {
    background: none;

    border: 0;
    border-bottom: 0.1em dashed;

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
    margin: 0 0 0.5em 0;
    color: #49075E;
    font-weight: 500;
}

.stratum-config>div {
    flex-grow: 1;
    /*flex-shrink: 0;*/
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

.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
