<template>
    <div>
        <div class="pos-rel">
            <span class="input-wrapper">
                <DynamicWidthInputField class="input"
                                        v-if="editable"
                                        v-model="stratumLabel"></DynamicWidthInputField>
                <span v-else>{{ stratum.label }}</span>
            </span>
            <button class="button delete"
                    v-if="deletable"
                    @click="deleteStratum">
                <span>Delete</span>
            </button>
        </div>
        <div class="subgroup-nesting-explanatory-text">
            One
            <b>{{ stratum.label }}</b> will contain a number of {{ pluralChildUnitText }}
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import { deepCopy, deepMerge } from "../util/Object";

import { Data as IStratum } from "../data/Stratum";

import DynamicWidthInputField from "./DynamicWidthInputField.vue";

@Component({
    components: {
        DynamicWidthInputField,
    },
})
export default class StrataStructureEditorStratumItem extends Vue {
    // Props
    @Prop stratum: IStratum = p({ type: Object, required: true, }) as any;
    @Prop childUnit: string = p({ type: String, required: false, default: "<group>" }) as any;
    @Prop deletable: boolean = p({ type: Boolean, required: true, }) as any;
    @Prop editable: boolean = p({ type: Boolean, required: false, default: true, }) as any;

    async updateStratum(diff: any) {
        // Deep copy and merge in diff
        const newStratum = deepMerge(deepCopy(this.stratum), diff);

        await this.$store.dispatch("upsertStratum", newStratum);
    }

    async deleteStratum() {
        await this.$store.dispatch("deleteStratumConfirmSideEffect", this.stratum);
    }

    get stratumLabel() {
        return this.stratum.label;
    }

    set stratumLabel(newValue: string) {
        this.updateStratum({
            label: newValue,
        });
    }

    get pluralChildUnitText() {
        if (this.childUnit === "person") {
            return "people";
        }
        return this.childUnit + "s";
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.input {
    background: none;

    border: 0;
    border-bottom: 0.1em dotted;

    color: #fff;

    cursor: pointer;
}

.input-wrapper {
    display: inline-block;
    background: #49075E;
    padding: 0.3em 0.5em;
    border-radius: 0.3em;

    font-size: 1.5em;

    color: #fff;
}

.subgroup-nesting-explanatory-text {
    font-size: 0.8em;
    font-style: italic;

    color: rgba(0, 0, 0, 0.8);

    margin: 0.5em;
}

button.delete {
    display: inline-flex;
    border: 0;
    margin: 0;
    padding: 0;

    width: 1.5em;
    height: 1.5em;

    background: transparent;

    border-radius: 50%;

    justify-content: center;
    align-items: center;

    position: absolute;
    margin-top: 1em;
    margin-left: 0.2em;
}

button.delete>span {
    display: none;

    position: absolute;
    left: 2em;
    color: #777;

    text-align: left;
}

button.delete::before {
    display: block;
    content: "";

    width: 1.3em;
    height: 1.3em;

    /* 
     * "Trash" by Gregor Cresnar, "Pixel Perfect Collection" 
     * https://thenounproject.com/grega.cresnar/collection/pixel-perfect/?q=trash&i=976401
     * License: CC BY 3.0 US
     */
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMjAwJyBoZWlnaHQ9JzIwMCcgZmlsbD0iIzk5OTk5OSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkYXRhLW5hbWU9IkxheWVyIDEiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB4PSIwcHgiIHk9IjBweCI+PHRpdGxlPjFBcnRib2FyZCAyMTwvdGl0bGU+PHBhdGggZD0iTTU4LDIwdjZINzRhMiwyLDAsMCwxLDIsMnY0YTIsMiwwLDAsMS0yLDJIMjZhMiwyLDAsMCwxLTItMlYyOGEyLDIsMCwwLDEsMi0ySDQyVjIwYTIsMiwwLDAsMSwyLTJINTZBMiwyLDAsMCwxLDU4LDIwWk0zNCw4Mkg2NmE2LDYsMCwwLDAsNi02VjQwSDI4Vjc2QTYsNiwwLDAsMCwzNCw4MloiLz48L3N2Zz4=");
    background-repeat: no-repeat;
    background-size: cover;
}

button.delete:hover,
button.delete:focus,
button.delete:active {
    background-color: #8b0000;
}

button.delete:hover::before,
button.delete:focus::before,
button.delete:active::before {
    /* 
     * "Trash" by Gregor Cresnar, "Pixel Perfect Collection"
     * https://thenounproject.com/grega.cresnar/collection/pixel-perfect/?q=trash&i=976401
     * License: CC BY 3.0 US
     */
    background-image: url("data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48dGl0bGU+MUFydGJvYXJkIDIxPC90aXRsZT48cGF0aCBkPSJNNTgsMjB2Nkg3NGEyLDIsMCwwLDEsMiwydjRhMiwyLDAsMCwxLTIsMkgyNmEyLDIsMCwwLDEtMi0yVjI4YTIsMiwwLDAsMSwyLTJINDJWMjBhMiwyLDAsMCwxLDItMkg1NkEyLDIsMCwwLDEsNTgsMjBaTTM0LDgySDY2YTYsNiwwLDAsMCw2LTZWNDBIMjhWNzZBNiw2LDAsMCwwLDM0LDgyWiIvPjwvc3ZnPg==");
}

button.delete:hover>span,
button.delete:focus>span,
button.delete:active>span {
    display: block;
}
</style>
