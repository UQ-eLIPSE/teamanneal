<template>
    <div id="wrapper">
        <div id="welcome">
            <h1>Teams? Sorted.</h1>
            <p>
                TeamAnneal optimises allocation of teams
                <br> using constraints you provide.
                <a class="more"
                   href="https://www.elipse.uq.edu.au/team-anneal-team-formation"
                   target="_blank">Find out more.</a>
            </p>
            <p>
                <button class="button"
                        @click="goToAnneal">Create new teams</button>
                <button class="button secondary"
                        @click="goToEditor">Edit existing teams</button>
            </p>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class WelcomePanel extends Vue {
    goToAnneal() {
        this.$router.push({
            name: "anneal",
        });
    }

    goToEditor() {
        this.$router.push({
            name: "results-editor",
        });
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#wrapper {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

#welcome {
    background: #f2f2f2;
    border: 1px solid rgba(100, 100, 100, 0.3);
    width: 60vw;
    min-width: 40rem;
    max-width: 55rem;
    padding: 1rem 2rem;
    box-shadow: rgba(0, 0, 0, 0.3) 0 1rem 2rem;
    font-weight: 300;
    text-align: center;
}

h1 {
    color: #49075E;
    font-weight: 400;
    font-size: 3em;
    margin: 1rem 0;
}

p {
    margin: 1rem 0;
}
</style>
