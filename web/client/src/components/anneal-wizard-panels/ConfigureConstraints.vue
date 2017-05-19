<template>
    <div id="wizard">
        <h1>Configure constraints</h1>
        <p>
            TeamAnneal forms groups with consideration to constraints you provide. Add as many constraints as you need to describe desired properties for each group.
            <a class="more" href="#">Need help?</a>
        </p>
        <p>
            [Constraints editor]
        </p>
        <div class="bottom-buttons">
            <button class="button" @click="goToAnneal">Continue</button>
            <button class="button secondary" @click="goBack">Back</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class ConfigureConstraints extends Vue {

    goBack() {
        this.$router.back();
    }

    goToAnneal() {
        this.$router.push({
            path: "confirm-anneal",
        });
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#wizard {
    background: #f2f2f2;
    border: 1px solid rgba(100, 100, 100, 0.3);
    width: 60vw;
    min-width: 40rem;
    max-width: 55rem;
    max-height: 50vh;
    overflow-y: auto;
    box-shadow: rgba(0, 0, 0, 0.3) 0 1rem 2rem;
    font-weight: 300;
    transition: all 250ms ease-out;
    pointer-events: all;
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

#wizard .bottom-buttons :last-child {
    margin-right: auto;
}
</style>
