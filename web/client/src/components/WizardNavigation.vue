<template>
    <div>
        <ul>
            <li v-for="entry in entries"
                :key="entry.path"
                :class="getEntryClasses(entry)">
                <span v-if="isEntryDisabled(entry)">{{ getEntryLabel(entry) }}
                    <span v-if="displayWarning(entry)"
                          class="warning-icon">⚠</span>
                </span>
                <a v-else
                   href="#"
                   @click.prevent="goTo(entry)">{{ getEntryLabel(entry) }}
                    <span v-if="displayWarning(entry)"
                          class="warning-icon">⚠</span>
                </a>
            </li>
        </ul>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p } from "av-ts";

import { WizardNavigationEntry as WNE } from "../data/WizardNavigationEntry";

@Component
export default class WizardNavigation extends Vue {
    // Props
    @Prop entries = p<ReadonlyArray<Readonly<WNE>>>({ type: Array, required: true, });
    @Prop bus = p<Vue>({ required: true, });

    /**
     * Commands vue-router to move to the given entry's path
     */
    goTo(entry: WNE) {
        this.$router.push({
            path: entry.path,
        });
    }

    /**
     * Goes to the next step from the current active step, where defined
     */
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
        this.goTo(activeEntry.next());
    }




    isEntryActive(entry: WNE) {
        return this.$route.fullPath === entry.path;
    }

    isEntryDisabled(entry: WNE) {
        // Get the disabled checking function
        const isDisabled = entry.disabled;

        // If the function does not exist we assume that it is always not
        // disabled
        return isDisabled === undefined ? false : isDisabled();
    }

    displayWarning(entry: WNE) {
        // Do not display warning when entry is disabled
        if (this.isEntryDisabled(entry)) { return false; }

        // Get the warning display function
        const displayWarning = entry.warning;

        return displayWarning === undefined ? false : displayWarning();
    }

    getEntryLabel(entry: WNE) {
        const label = entry.label;

        // If `label` is a string, then just return the entry label as is
        if (typeof label === "string") {
            return label;
        }

        // If `label` is a function, then execute
        if (typeof label === "function") {
            return label();
        }

        throw new Error("Unknown entry label type");
    }

    getEntryClasses(entry: WNE) {
        const classes: Record<string, boolean> = {
            active: this.isEntryActive(entry),
            disabled: this.isEntryDisabled(entry),
        };

        if (entry.className !== undefined) {
            entry.className.split(" ").forEach(x => classes[x] = true);
        }

        return classes;
    }

    get activeEntry() {
        return this.entries.find(this.isEntryActive.bind(this));
    }



    /**
     * Processes incoming "wizardNavigation" events
     */
    onWizardNavigation(data: any) {
        switch (data.event) {
            case "next": return this.goNext();
        }

        throw new Error("Unknown wizard navigation event");
    }



    @Lifecycle created() {
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
    line-height: 1.1;
}

li a {
    color: inherit;
    text-decoration: none;
    word-break: break-word;
}

li.active {
    background: #49075e;

    color: #fff;
    font-weight: 400;
}

li.disabled {
    color: rgba(0, 0, 0, 0.3);
    font-style: italic;
}

li.spacer-top {
    margin-top: 1em;
}

.warning-icon {
    color: #fff;
    display: inline-block;
    background: darkred;
    padding: 0 0.1em;
    font-size: 0.8em;
}
</style>

