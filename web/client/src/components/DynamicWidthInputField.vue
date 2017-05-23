<template>
    <input v-model="inputValue" :style="{ width: elWidth }">
    </input>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Watch, Prop, p } from "av-ts";

const widthTestElement = document.createElement("span");

@Component
export default class DynamicWidthInputField extends Vue {
    // Props
    @Prop val = p(String);

    // Private
    inputValue: string = "";
    elWidth: string = "0px";

    @Watch("inputValue")
    onInputValueChange(newVal: string) {
        // Extract element and value
        const el = this.$el as HTMLInputElement;
        const value = newVal;

        // Set up width test element
        const parentNode = el.parentNode!;
        widthTestElement.textContent = value;
        parentNode.insertBefore(widthTestElement, el);

        // Test width
        const rect = widthTestElement.getBoundingClientRect();
        const width = rect.width;

        // Remove test element
        parentNode.removeChild(widthTestElement);

        // Update element width
        this.elWidth = `${width}px`;

        // Pass value back up via. `change` event
        this.$emit("change", value);
        console.log(`emitted ${value}`);
    }

    @Lifecycle mounted() {
        this.inputValue = this.val!;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
input {
    padding: 0 0.2em;
    min-width: 1px;
}
</style>
