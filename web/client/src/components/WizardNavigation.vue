<template>
    <div>
        <ul>
            <li v-for="entry in entries" :class="{ 'active': isEntryActive(entry), 'disabled': false, }">
                <a href="#" @click.prevent="goTo(entry)">{{ entry.label }}</a>
            </li>
        </ul>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p } from "av-ts";

import * as WizardNavigationEntry from "../data/WizardNavigationEntry";

@Component
export default class WizardNavigation extends Vue {
    // Props
    @Prop entries: ReadonlyArray<Readonly<WizardNavigationEntry.WizardNavigationEntry>> = p(Array) as any;

    goTo(entry: WizardNavigationEntry.WizardNavigationEntry) {
        console.log(`Going to: ${entry.path}`);

        this.$router.push({
            path: entry.path,
        });
    }



    isEntryActive(entry: WizardNavigationEntry.WizardNavigationEntry) {
        return this.currentRouterFullPath === entry.path;
    }

    get currentRouterFullPath() {
        return this.$store.state.routerFullPath;
    }





    @Lifecycle created() {
        // Watch the store for any changes
        this.$store.watch(_ => _, state => {
            // Go through all steps and execute update functions
            console.log(state);
        });
    }


}
</script>

<!-- ####################################################################### -->

<style scoped>
ul {
    margin: 0;
    padding: 0;

    list-style: none;
}

li {
    margin: 0;
    padding: 0.4em 1.2em 0.4em 0.7em;

    font-size: 1.5em;
}

li a {
    color: inherit;
    text-decoration: none;
}

li.active {
    background: #49075e;

    color: #fff;
    font-weight: 400;
}

li.disabled {
    color: #000;
}

li.disabled a {
    cursor: none;
}
</style>

