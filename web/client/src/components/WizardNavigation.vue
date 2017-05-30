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

type WNE = WizardNavigationEntry.WizardNavigationEntry;

@Component
export default class WizardNavigation extends Vue {
    // Props
    @Prop entries: ReadonlyArray<Readonly<WNE>> = p(Array) as any;
    @Prop bus: Vue = p(Object) as any;

    goTo(entry: WNE) {
        this.$router.push({
            path: entry.path,
        });
    }

    goNext() {
        // Find the "next" function
        const activeEntry = this.activeEntry;

        if (activeEntry === undefined) {
            return;
        }

        if (activeEntry.next === undefined) {
            return;
        }

        // Execute the next function to get the next entry to move to
        this.goTo(activeEntry.next(this.$store.state));
    }




    isEntryActive(entry: WNE) {
        return this.currentRouterFullPath === entry.path;
    }

    get activeEntry() {
        return this.entries.find(this.isEntryActive.bind(this));
    }

    get currentRouterFullPath() {
        return this.$store.state.routerFullPath;
    }




    onWizardNavigation(data: any) {
        switch (data.event) {
            case "next": return this.goNext();
        }

        throw new Error("Unknown wizard navigation event");
    }



    @Lifecycle created() {
        // Watch the store for any changes
        this.$store.watch(_ => _, state => {
            // Go through all steps and execute update functions
            console.log(state);
        });

        // Pick up any "wizardNavigation" events that come through from the
        // parent-supplied bus
        this.bus.$on("wizardNavigation", this.onWizardNavigation.bind(this));
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

