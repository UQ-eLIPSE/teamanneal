<template>
    <select @change="onSelectChange" :style="{ width: elWidth }">
        <option v-for="(option, i) in list" :value="option" :selected="i === selectedIndex">{{ option.text }}</option>
    </select>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Watch, Prop, p } from "av-ts";

// The "test elements" below are used to determine the width of the select menu
// during resize
const selectTestElement = document.createElement("select");
const widthTestElement = document.createElement("option");

selectTestElement.className = "__DynamicWidthSelect_TestElement";
selectTestElement.appendChild(widthTestElement);

@Component
export default class DynamicWidthSelect extends Vue {
    // Props
    @Prop list = p({ type: Array, required: true, });
    @Prop selectedIndex: number = p({ type: Number, required: true, default: 0, }) as any;

    // Private
    elWidth: string = "0px";

    onSelectChange() {
        const el = this.$el as HTMLSelectElement;
        const selectedIndex = el.selectedIndex;

        // Rerender the select menu
        const newOption = this.list![selectedIndex];
        const text = newOption.text;

        this.updateRenderWidth(text);

        // Pass value back up via. `change` event
        this.$emit("change", newOption);
    }

    updateRenderWidth(text: string) {
        // Extract element
        const el = this.$el as HTMLSelectElement;

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
    }

    @Watch("list")
    onListChange() {
        // Rerender the select menu
        let newOption = this.list![this.selectedIndex];

        // If the option does not exist, we set the supposed selected index to
        // 0 and do it again
        if (newOption === undefined) {
            newOption = this.list![0];
        }

        const text = newOption.text;

        this.updateRenderWidth(text);

        // Fire change event again
        this.$emit("change", newOption);
    }

    @Lifecycle mounted() {
        // Rerender the select menu
        let newOption = this.list![this.selectedIndex];

        // If the option does not exist, we set the supposed selected index to
        // 0 and do it again
        if (newOption === undefined) {
            newOption = this.list![0];
        }

        const text = newOption.text;

        this.updateRenderWidth(text);

        // Fire change event again
        this.$emit("change", newOption);
    }
}
</script>

<!-- ####################################################################### -->
<!-- 
    Global styles required because we don't actually generate a DOM element 
    from within Vue, so it's not tagged and/or scoped
-->
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
