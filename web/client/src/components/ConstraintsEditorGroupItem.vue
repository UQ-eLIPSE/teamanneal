<template>
    <div id="constraint-group">
        Each
        <DynamicWidthSelect class="select" :list="strata" @change="" />:
        <div id="constraint-items">
            <ConstraintsEditorConstraintItem />
            <ConstraintsEditorConstraintItem />
            <ConstraintsEditorConstraintItem />
        </div>
        <button @click="addNewConstraint">Add new constraint</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import DynamicWidthSelect from "./DynamicWidthSelect.vue";
import ConstraintsEditorConstraintItem from "./ConstraintsEditorConstraintItem.vue";

@Component({
    components: {
        DynamicWidthSelect,
        ConstraintsEditorConstraintItem,
    },
})
export default class ConstraintEditorGroupItem extends Vue {
    strata = [
        { value: "Team", text: "Team", },
        { value: "Group", text: "Group", },
        { value: "Table", text: "Table", },
    ]
}
</script>

<!-- ####################################################################### -->

<style scoped>
.select {
    background: none;

    border: 0;
    border-bottom: 0.1em dashed;

    color: #49075E;

    cursor: pointer;
}

#constraint-group {
    background: rgba(0, 0, 0, 0.05);

    padding: 0.5em;

    font-size: 1.5em;
}

#constraint-items {
    margin-left: 1em;
}
</style>
