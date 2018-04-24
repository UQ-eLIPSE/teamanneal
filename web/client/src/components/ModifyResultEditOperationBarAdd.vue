<template>
    <div class="add-operation">
        <div class="operation-banner">
            <span>Add Person</span>
        </div>

        <div class="content">
            <!-- Content goes here -->

        </div>
    </div>
</template>


<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

@Component
export default class ModifyResultEditOperationBarAdd extends Vue {
    @Prop person = p<any>({ required: false });

}
</script>

<style scoped>
.add-operation {
    display: flex;
}

.operation-banner {
    height: 100%;
    background-color: #49075e;
    color: white;
    font-size: 1.7em;
    font-family: inherit;
    padding: 1.2rem 1rem 1.2rem 0.5rem;
}
</style>