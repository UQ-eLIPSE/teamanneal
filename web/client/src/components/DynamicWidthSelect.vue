<template>
    <select v-model="activeItemValue"
            :disabled="disabled"
            :style="{ width: elWidth }">
        <option v-for="item in list"
                :key="item.value"
                :value="item.value"
                :selected="item.value === activeItemValue">{{ item.text }}</option>
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

@Component({
    model: {
        event: "valueUpdate",
        prop: "selectedValue",
    },
})
export default class DynamicWidthSelect extends Vue {
    // Props
    @Prop list: any[] = p({ type: Array, required: true, }) as any;
    @Prop selectedValue: any = p({ required: true, }) as any;
    @Prop minWidth: number = p({ type: Number, required: false, default: 20 }) as any;
    @Prop disabled: boolean = p({ type: Boolean, required: false, default: false, }) as any;

    // Private
    elWidth: string = "0px";

    get activeItem() {
        return this.list.find(item => item.value === this.activeItemValue);
    }

    get activeItemValue() {
        return this.selectedValue;
    }

    set activeItemValue(newValue: any) {
        this.$emit("valueUpdate", newValue);
    }

    updateRenderWidth() {
        const activeItem = this.activeItem;

        // Can't do anything if we have no item selected
        if (activeItem === undefined) {
            return;
        }

        // Extract element
        const el = this.$el as HTMLSelectElement;

        // Set up width test element
        const parentNode = el.parentNode!;
        widthTestElement.textContent = activeItem.text;
        parentNode.insertBefore(selectTestElement, el);

        // Test width
        const rect = selectTestElement.getBoundingClientRect();
        const width = Math.max(this.minWidth, (rect.width >>> 0) + 1);

        // Remove test element
        parentNode.removeChild(selectTestElement);

        // Update element width
        this.elWidth = `${width}px`;
    }

    @Watch("selectedValue")
    onSelectedValueChange() {
        this.updateRenderWidth();
    }

    @Lifecycle mounted() {
        // Force update render width now
        this.updateRenderWidth();
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
