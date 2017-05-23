<template>
    <div>
        <div id="constraint-groups">
            <ConstraintsEditorGroupItem class="constraint-group" />
            <ConstraintsEditorGroupItem class="constraint-group" />
        </div>
        <div>
            <button @click="addNewGroupConstraints">Add group constraints</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import ConstraintsEditorGroupItem from "./ConstraintsEditorGroupItem.vue";

@Component({
    components: {
        ConstraintsEditorGroupItem,
    },
})
export default class ConstraintsEditor extends Vue {
}
</script>

<!-- ####################################################################### -->

<style scoped>
#constraint-groups {
    background: rgba(0, 0, 0, 0.05);

    display: flex;
    flex-direction: column;
}

.constraint-group {
    margin: 0.5em;
}
</style>
