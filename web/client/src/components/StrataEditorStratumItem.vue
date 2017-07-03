<template>
    <div>
        <div>
            <span class="stratum-label">{{ stratum.label }}</span>
        </div>
        <div class="stratum-config">
            <div class="stratum-size">
                <h3>Sizing</h3>
                <div class="size-block">
                    <div class="three-sizes">
                        <div>
                            <div>Min</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        :val="''+stratum.size.min"
                                                        @change="onMinValueChange" />
                            </span>
                        </div>
                        <div>
                            <div>Ideal</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        :val="''+stratum.size.ideal"
                                                        @change="onIdealValueChange" />
                            </span>
                        </div>
                        <div>
                            <div>Max</div>
                            <span class="input-area">
                                <DynamicWidthInputField class="input"
                                                        :val="''+stratum.size.max"
                                                        @change="onMaxValueChange" />
                            </span>
                        </div>
                    </div>
                    <div class="size-unit-text">
                        {{ pluralChildUnitText }} per {{ stratum.label }}
                    </div>
                </div>
            </div>
            <div class="stratum-name">
                <h3>Naming</h3>
                <div>
                    <select :value="counterSelectValue"
                            @change="onCounterSelectChange">
                        <option v-for="counterOption in counterList"
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
            return "people";
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

.three-sizes>div {
    padding: 0.3em;
    background: rgba(0, 0, 0, 0.05);

    flex-grow: 0;
    flex-shrink: 0;

    width: 30%;
}

.three-sizes .input-area {
    font-size: 1.5em;
}

.size-unit-text {
    padding: 0.3em;
    background: rgba(0, 0, 0, 0.05);

    font-size: 0.8em;
    font-style: italic;
    color: rgba(0, 0, 0, 0.8);
}

.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
