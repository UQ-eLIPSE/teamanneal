<template>
    <div>
        <!-- Special information layout for partitions -->
        <template v-if="isPartition">
            <div>
                <span class="stratum-label">Pool ({{ stratum.label }})</span>
            </div>
            <div class="stratum-config">
                <div>
                    <table class="partition-table">
                        <tr>
                            <th>{{ stratum.label }}</th>
                            <th>Number of {{ pluralChildUnitText }}</th>
                        </tr>
                        <tr v-for="(partition, i) in limitedPartitions"
                            :key="i">
                            <td>{{ partition.value }}</td>
                            <td>{{ numberOfPartitionChildren(i) }}</td>
                        </tr>
                    </table>
                    <p>
                        <a href="#" 
                           v-if="partitions.length > limitedPartitionsDisplayLength"
                           class="more"
                           @click.prevent="togglePartitionList">{{ moreButtonText }}</a>
                    </p>
                </div>
            </div>
        </template>

        <!-- General layout for all other strata -->
        <template v-else>
            <div>
                <span class="stratum-label">{{ stratum.label }}</span>
            </div>
            <div class="stratum-config">
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
                    <StrataEditorStratumItemCustomNameList v-if="isCounterCustomList"
                                                           v-model="customNameList"
                                                           :stratumLabel="stratum.label"
                                                           :minCount="customNameListMinCounts[stratum._id]"></StrataEditorStratumItemCustomNameList>
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
        </template>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { numberSort } from "../util/Array";
import { parseUint32 } from "../util/Number";
import { deepCopy, deepMerge } from "../util/Object";

import { Stratum } from "../data/Stratum";
import * as StratumSize from "../data/StratumSize";
import { StratumNamingConfig, generateRandomExampleName } from "../data/StratumNamingConfig";
import { StratumNamingConfigContext, Context as StratumNamingConfigContextEnum } from "../data/StratumNamingConfigContext";
import { MinimalDescriptor as IColumnData_MinimalDescriptor } from "../data/ColumnData";
import * as ListCounter from "../data/ListCounter";
import { DeepPartial } from "../data/DeepPartial";

import { AnnealCreator as S } from "../store";

import DynamicWidthInputField from "./DynamicWidthInputField.vue";
import StrataEditorStratumItemCustomNameList from "./StrataEditorStratumItemCustomNameList.vue";

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
        StrataEditorStratumItemCustomNameList
    },
})
export default class StrataEditorStratumItem extends Vue {
    // Props
    @Prop stratum = p<Stratum>({ required: true, });
    @Prop stratumNamingConfig = p<StratumNamingConfig>({ required: true, });
    @Prop childUnit = p({ type: String, required: true, });
    @Prop groupSizes = p<{ [groupSize: number]: number }>({ required: false, });
    @Prop isPartition = p({ type: Boolean, required: false, default: false, });
    @Prop partitionColumnData = p<IColumnData_MinimalDescriptor | undefined>({ required: false, default: undefined, });
    @Prop namingContexts = p<ReadonlyArray<Stratum>>({ type: Array, required: false, default: () => [], });

    /** 
     * Manages whether all partitions are to be displayed or just min(#partitions, limitedPartitionsDisplayLength).
     * Limits i.e. value is `true` by default
     */
    private limitPartitionList: boolean = true;

    get randomExampleName() {
        return generateRandomExampleName(this.stratumNamingConfig);
    }

    get stratumSize() {
        return this.stratum.size;
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

    get pluralChildUnitTextFirstCharCapitalised() {
        const text = this.pluralChildUnitText;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    get counterList() {
        return CounterList;
    }

    get stratumSizeMinClasses() {
        const classes = {
            "invalid-size": (
                StratumSize.isSizeMinNotUint32(this.stratumSize) ||
                StratumSize.isSizeMinGreaterThanIdeal(this.stratumSize) ||
                StratumSize.isSizeMinEqualToMax(this.stratumSize) ||
                StratumSize.isSizeMinLessThanOne(this.stratumSize)
            ),
        }

        return classes;
    }

    get stratumSizeIdealClasses() {
        const classes = {
            "invalid-size": (
                StratumSize.isSizeIdealNotUint32(this.stratumSize) ||
                StratumSize.isSizeMinGreaterThanIdeal(this.stratumSize) ||
                StratumSize.isSizeIdealGreaterThanMax(this.stratumSize)
            ),
        }

        return classes;
    }

    get stratumSizeMaxClasses() {
        const classes = {
            "invalid-size": (
                StratumSize.isSizeMaxNotUint32(this.stratumSize) ||
                StratumSize.isSizeIdealGreaterThanMax(this.stratumSize) ||
                StratumSize.isSizeMinEqualToMax(this.stratumSize)
            ),
        }

        return classes;
    }

    get stratumSizeErrors() {
        const errMsgs: string[] = [];
        const stratumSize = this.stratumSize;

        /**
         * Runs error check functions, and if true, adds error message to array
         */
        const errCheck =
            (func: (stratumSize: StratumSize.StratumSize) => boolean, msg: string) =>
                func(stratumSize) && errMsgs.push(msg);


        // Run checks
        errCheck(StratumSize.isSizeMinNotUint32, "Min size is not an integer");
        errCheck(StratumSize.isSizeIdealNotUint32, "Ideal size is not an integer");
        errCheck(StratumSize.isSizeMaxNotUint32, "Max size is not an integer");

        errCheck(StratumSize.isSizeMinGreaterThanIdeal, "Min size cannot be greater than ideal size");
        errCheck(StratumSize.isSizeIdealGreaterThanMax, "Ideal size cannot be greater than max size");

        errCheck(StratumSize.isSizeMinEqualToMax, "Min size cannot be equal to max size");

        errCheck(StratumSize.isSizeMinLessThanOne, "Min size cannot be less than 1");

        // If `groupSizes` is undefined, then the group size calculation failed
        // to produce a valid set of groups
        if (this.groupSizes === undefined) {
            errMsgs.push("Group sizes cannot be met");
        }

        // Return array of error messages
        return errMsgs;
    }

    get counterType() {
        const counter = this.stratumNamingConfig.counter;

        if (Array.isArray(counter)) {
            return "custom";
        } else {
            return counter as string;
        }
    }

    set counterType(newValue: string) {
        const oldCounterValue = this.stratumNamingConfig.counter;

        if (newValue === "custom") {
            // If already a custom array, do nothing
            if (Array.isArray(oldCounterValue)) {
                return;
            }

            // Otherwise set the counter to a default array
            // Default custom list is "Red", "Green", "Blue"
            S.dispatch(S.action.SET_STRATUM_NAMING_CONFIG_COUNTER, { stratum: this.stratum, counter: ["Red", "Green", "Blue"] });
        } else {
            S.dispatch(S.action.SET_STRATUM_NAMING_CONFIG_COUNTER, { stratum: this.stratum, counter: newValue as ListCounter.ListCounterType });
        }
    }

    get isCounterCustomList() {
        return Array.isArray(this.stratumNamingConfig.counter);
    }

    get namingContext() {
        return this.stratumNamingConfig.context;
    }

    set namingContext(newValue: StratumNamingConfigContext) {
        S.dispatch(S.action.SET_STRATUM_NAMING_CONFIG_CONTEXT, { stratum: this.stratum, context: newValue });
    }

    get namingContextOptionList() {
        const list: { value: StratumNamingConfigContext, text: string }[] = this.namingContexts.map((stratum) => {
            return {
                value: stratum._id,
                text: `per ${stratum.label}`,
            };
        });

        // Add partition option where set
        if (this.partitionColumnData !== undefined) {
            list.unshift({
                value: StratumNamingConfigContextEnum.PARTITION,
                text: `per partition (${this.partitionColumnData.label})`,
            });
        }

        // Global is always available
        list.unshift({
            value: StratumNamingConfigContextEnum.GLOBAL,
            text: "globally",
        });

        return list;
    }

    get showNamingContextOptions() {
        return this.namingContextOptionList.length > 1;
    }

    async updateStratum(diff: DeepPartial<Stratum>) {
        // Deep copy and merge in diff
        const newStratum = deepMerge(deepCopy(this.stratum), diff);

        await S.dispatch(S.action.UPSERT_STRATUM, newStratum);
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

        if (groupSizes === undefined) {
            throw new Error("Group sizes do not exist");
        }

        const groupSizeKeys = Object.keys(groupSizes).map(x => +x);

        // Sort group size keys
        numberSort(groupSizeKeys);

        // Produce group size ordered array with the count for each group size
        return groupSizeKeys.map((size) => {
            const count = groupSizes[size];

            return {
                size,
                count,
            }
        });
    }

    get customNameList() {
        // We assume that this is only used when the custom name functionality
        // is enabled, and so assert that we're delivering a string array
        return this.stratumNamingConfig.counter as string[];
    }

    set customNameList(names: string[]) {
        S.dispatch(S.action.SET_STRATUM_NAMING_CONFIG_COUNTER, { stratum: this.stratum, counter: names });
    }

    get customNameListMinCounts() {
        return S.get(S.getter.EXPECTED_NAME_LABELS_FOR_EACH_STRATUM);
    }

    get partitions() {
        return S.get(S.getter.EXPECTED_PARTITIONS);
    }

    get expectedNodeTree() {
        return S.get(S.getter.EXPECTED_NODE_TREE);
    }

    /**
     * Returns a limited number of partitions i.e. min(#partitions, limitedPartitionsDisplayLength) when `limitPartitionsList` is set to `true`.
     * Returns all partitions if `limitPartitionList` is set to `false`.
     */
    get limitedPartitions() {
        if (this.limitPartitionList) {
            return this.partitions.slice(0, Math.min(this.partitions.length, this.limitedPartitionsDisplayLength));
        }
        return this.partitions;
    }

    get moreButtonText() {
        const numberOfPartitions = this.partitions.length;
        return this.limitPartitionList ? `Show all ${numberOfPartitions} ${this.stratum.label + (numberOfPartitions === 1 ? "" : "s")}` : `Show fewer ${this.stratum.label}s`;
    }

    togglePartitionList() {
        this.limitPartitionList = !this.limitPartitionList;
    }

    /**
     * Returns number of immediate child nodes for a given partition.
     * 
     * @param partitionIndex Index of the given partition
     */
    numberOfPartitionChildren(partitionIndex: number) {
        const partitionNode = this.expectedNodeTree[partitionIndex];

        if (partitionNode === undefined) {
            return undefined;
        }

        return partitionNode.children.length
    }

    /**
     * Specifies the number of partitions displayed when list of partitions is limited. Can be changed to any positive integer if required.
     */
    get limitedPartitionsDisplayLength() {
        return 3;
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

a.more {
    color: #49075e;
    border-bottom: 1px dotted #49075e;
    text-decoration: none;
    display: inline-block;
    padding: 0 3px;
    align-self: flex-end;
}

.partition-table {
    border-collapse: collapse;
}

.partition-table th,
.partition-table td {
    border: 1px solid #aaa;
    padding: 0.2em 0.6em;
}
</style>
