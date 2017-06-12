<template>
    <div>
        {{ p_label }} should have
        <DynamicWidthInputField class="input" :val="''+p_ideal" @change="onIdealValueChange" /> {{ childUnitText }}s, with min
        <DynamicWidthInputField class="input" :val="''+p_min" @change="onMinValueChange" /> and max
        <DynamicWidthInputField class="input" :val="''+p_max" @change="onMaxValueChange" />
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p } from "av-ts";

import DynamicWidthInputField from "./DynamicWidthInputField.vue";
import * as Stratum from "../data/Stratum";

@Component({
    components: {
        DynamicWidthInputField,
    },
})
export default class StrataEditorStratumItem extends Vue {
    // Props
    @Prop stratum: Stratum.Stratum = p(Object) as any;
    @Prop childUnit = p(String);

    // Private data
    p_label: string = "";
    p_min: number = 0;
    p_ideal: number = 0;
    p_max: number = 0;

    onLabelValueChange(newValue: string) {
        this.p_label = newValue;
        this.emitChange();
    }

    onMinValueChange(newValue: string) {
        this.p_min = +newValue || 0;        // Convert to number
        this.emitChange();
    }

    onIdealValueChange(newValue: string) {
        this.p_ideal = +newValue || 0;      // Convert to number
        this.emitChange();
    }

    onMaxValueChange(newValue: string) {
        this.p_max = +newValue || 0;        // Convert to number
        this.emitChange();
    }

    get childUnitText() {
        return this.childUnit || "<unit>";
    }

    emitChange() {
        const thisStratum: Stratum.Stratum = this.stratum as any;

        const stratum: Stratum.Stratum = {
            _id: thisStratum._id,
            label: this.p_label,
            size: {
                min: this.p_min,
                ideal: this.p_ideal,
                max: this.p_max,
            },
        }

        const stratumUpdate: Stratum.Update = {
            stratum,
        }

        this.$emit("change", stratumUpdate);
    }

    transferPropsToData() {
        const stratum = this.stratum;

        this.p_label = stratum.label;
        this.p_min = stratum.size.min;
        this.p_ideal = stratum.size.ideal;
        this.p_max = stratum.size.max;
    }

    @Lifecycle created() {
        this.transferPropsToData();
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
</style>
