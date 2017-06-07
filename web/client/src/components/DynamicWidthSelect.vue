<template>
    <select @change="onSelectChange" :style="{ width: elWidth }">
        <option v-for="(option, i) in list" :value="option" :selected="i === p_selectedIndex">{{ option.text }}</option>
    </select>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Watch, Prop, p } from "av-ts";

const selectTestElement = document.createElement("select");
const widthTestElement = document.createElement("option");

selectTestElement.className = "__DynamicWidthSelect_TestElement";
selectTestElement.appendChild(widthTestElement);

@Component
export default class DynamicWidthSelect extends Vue {
    // Props
    @Prop list = p(Array);
    @Prop selectedIndex = p(Number);

    // Private
    p_selectedIndex: number = -1;
    elWidth: string = "0px";

    onSelectChange() {
        const el = this.$el as HTMLSelectElement;
        this.p_selectedIndex = el.selectedIndex;
    }

    @Watch("p_selectedIndex")
    onSelectedValueChange(newSelectedIndex: number) {
        // Extract element and value
        const el = this.$el as HTMLSelectElement;
        const newOption = this.list![newSelectedIndex];
        const text = newOption.text;

        // Set up width test element
        const parentNode = el.parentNode!;
        widthTestElement.textContent = text;
        parentNode.insertBefore(selectTestElement, el);

        // Test width
        const rect = selectTestElement.getBoundingClientRect();
        const width = rect.width;

        // Remove test element
        parentNode.removeChild(selectTestElement);

        // Update element width
        this.elWidth = `${width}px`;

        // Pass value back up via. `change` event
        this.$emit("change", newOption);
    }

    @Lifecycle mounted() {
        this.p_selectedIndex = this.selectedIndex || 0;

        // IE11 fix for selectedIndex not being reflected on mount
        const el = this.$el as HTMLSelectElement;
        setTimeout(() => {
            // Force selected index after a short while
            el.selectedIndex = this.p_selectedIndex;
        }, 0);
    }
}
</script>

<!-- ####################################################################### -->
<style>
.__DynamicWidthSelect_TestElement {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 1px;

    box-sizing: content-box;

    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.__DynamicWidthSelect_TestElement option {
    margin: 0;
    padding: 0;
    border: 0;
}

.__DynamicWidthSelect_TestElement::-ms-expand {
    display: none;
}
</style>

<style scoped>
select {
    padding: 0 0.2em;
    min-width: 1px;

    box-sizing: content-box;

    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

option {
    margin: 0;
    padding: 0;
    border: 0;
}

select::-ms-expand {
    display: none;
}
</style>
