<template>
    <div id="wizard">
        <h1 class="overflow-ellipsis">Double check data</h1>
        <p>
            Take a moment to make sure column data types and all records are correct.
            <a class="more" href="#">Need help?</a>
        </p>
        <div class="bottom-buttons">
            <button class="button" @click="emitWizardNavNext">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class ReviewRecords extends Vue {
    emitWizardNavNext() {
        this.$emit("wizardNavigation", {
            event: "next",
        });
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#wizard {
    padding: 1rem 2rem;
}

#wizard h1 {
    color: #49075E;
    font-weight: 400;
    font-size: 2.5em;
    margin: 1rem 0;
}

#wizard p {
    margin: 1rem 0;
}

#wizard .bottom-buttons {
    background: rgba(0, 0, 0, 0.05);
    margin: 0 -2rem -1rem;
    padding: 1rem 2rem;

    display: flex;
    flex-direction: row-reverse;
}

#wizard .bottom-buttons>* {
    margin: 0 0.2em;
}

.overflow-ellipsis {
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
