<template>
    <input v-model="inputValue"
           :disabled="disabled"
           :style="{ width: elWidth }">
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Watch, Prop, p } from "av-ts";

const widthTestElement = document.createElement("span");

@Component({
    model: {
        event: "change",
        prop: "value",
    },
})
export default class DynamicWidthInputField extends Vue {
    // Props
    @Prop value = p<any>({ required: true, });
    @Prop minWidth = p({ type: Number, required: false, default: 1, });
    @Prop disabled = p({ type: Boolean, required: false, default: false, });

    // Private
    elWidth: string = "0px";

    get inputValue() {
        return '' + this.value;
    }

    set inputValue(newValue: string) {
        // Pass value back up via. `change` event
        this.$emit("change", newValue);

        // Ensure that input values always sync up
        this.syncInputValueToElement();
    }

    updateRenderWidth() {
        const value = this.inputValue;

        // Can't do anything if we have no value
        if (value === undefined) {
            return;
        }

        // Extract element and value
        const el = this.$el as HTMLInputElement;

        // Set up width test element
        const parentNode = el.parentNode!;
        widthTestElement.textContent = value;
        parentNode.insertBefore(widthTestElement, el);

        // Test width
        const rect = widthTestElement.getBoundingClientRect();
        const width = Math.max(this.minWidth, (rect.width >>> 0) + 1);

        // Remove test element
        parentNode.removeChild(widthTestElement);

        // Update element width
        this.elWidth = `${width}px`;
    }

    syncInputValueToElement() {
        // Extract element and value
        const el = this.$el as HTMLInputElement;

        // Check values after Vue has reconciled changes
        Vue.nextTick(() => {
            // If the values do not match, then force resync
            if (this.inputValue !== el.value) {
                el.value = this.inputValue;
            }
        });
    }

    @Watch("value")
    onValueChange(_value: any, _oldValue: any) {
        this.updateRenderWidth();
    }

    @Lifecycle mounted() {
        // Force update render width now
        this.updateRenderWidth();
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
input {
    padding: 0 0.2em;
    min-width: 1px;

    box-sizing: content-box;
}

::-ms-clear {
    display: none;
}

::-webkit-search-decoration,
::-webkit-search-cancel-button,
::-webkit-search-results-button,
::-webkit-search-results-decoration {
    display: none;
}
</style>
