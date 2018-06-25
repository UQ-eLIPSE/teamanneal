<template>
    <div>
        <ul>
            <li v-for="entry in entries"
                :key="entry.path"
                :class="getEntryClasses(entry)">
                <span v-if="isEntryDisabled(entry)">{{ getEntryLabel(entry) }}
                    <span v-if="displayWarning(entry)"
                          class="warning-icon"></span>
                </span>
                <a v-else
                   href="#"
                   @click.prevent="goTo(entry)">{{ getEntryLabel(entry) }}
                    <span v-if="displayWarning(entry)"
                          class="warning-icon"></span>
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
            name: entry.name,
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
        return this.$route.name === entry.name;
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
    display: inline-block;
    word-break: break-all;
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

li.active.disabled {
    color: #fff;
}

li.spacer-top {
    margin-top: 1em;
}

.warning-icon::before {
    content: "";
    display: inline-block;
    width: 0.9em;
    height: 0.9em;
    background-image: url(data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSI+DQo8ZyBpZD0ic3VyZmFjZTEiPg0KPHBhdGggc3R5bGU9ImZpbGw6I0ZGODgwMCIgZD0iTSAyMS4zOTg0MzggMTAuNjAxNTYzIEwgMTMuMzk4NDM4IDIuNjAxNTYzIEMgMTIuNjAxNTYzIDEuODAwNzgxIDExLjM5ODQzOCAxLjgwMDc4MSAxMC42MDE1NjMgMi42MDE1NjMgTCAyLjYwMTU2MyAxMC42MDE1NjMgQyAxLjgwMDc4MSAxMS4zOTg0MzggMS44MDA3ODEgMTIuNjAxNTYzIDIuNjAxNTYzIDEzLjM5ODQzOCBMIDEwLjYwMTU2MyAyMS4zOTg0MzggQyAxMS4zOTg0MzggMjIuMTk5MjE5IDEyLjYwMTU2MyAyMi4xOTkyMTkgMTMuMzk4NDM4IDIxLjM5ODQzOCBMIDIxLjM5ODQzOCAxMy4zOTg0MzggQyAyMi4xOTkyMTkgMTIuNjAxNTYzIDIyLjE5OTIxOSAxMS4zOTg0MzggMjEuMzk4NDM4IDEwLjYwMTU2MyBaIE0gMTMgMTcgTCAxMSAxNyBMIDExIDE1IEwgMTMgMTUgWiBNIDEzIDEzIEwgMTEgMTMgTCAxMSA3IEwgMTMgNyBaICI+PC9wYXRoPg0KPC9nPg0KPC9zdmc+);
    background-size: contain;
    background-repeat: no-repeat;
    vertical-align: middle;
}
</style>

