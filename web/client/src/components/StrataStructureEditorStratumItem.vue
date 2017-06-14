<template>
    <div>
        <div>
            <span class="input-wrapper">
                <DynamicWidthInputField class="input"
                                        :val="p_label"
                                        @change="onLabelValueChange" />
            </span>
            <button class="button delete"
                    @click="emitDelete">
                <span>Delete</span>
            </button>
        </div>
        <div class="subgroup-nesting-explanatory-text">
            One
            <b>{{ p_label }}</b> will contain many {{ pluralChildUnitText }}
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p } from "av-ts";

import DynamicWidthInputField from "./DynamicWidthInputField.vue";
import * as Stratum from "../data/Stratum";

@Component({
    components: {
        DynamicWidthInputField,
    },
})
export default class StrataStructureEditorStratumItem extends Vue {
    // Props
    @Prop stratum: Stratum.Stratum = p(Object) as any;
    @Prop childUnit = p(String);

    // Private data
    p_label: string = "";

    onLabelValueChange(newValue: string) {
        this.p_label = newValue;
        this.emitChange();
    }

    get childUnitText() {
        return this.childUnit || "<unit>";
    }

    get pluralChildUnitText() {
        if (this.childUnitText === "person") {
            return "people";
        }
        return this.childUnitText + "s";
    }

    emitChange() {
        const stratum: Stratum.Stratum = {
            _id: this.stratum._id,
            label: this.p_label,
            size: this.stratum.size,
            counter: this.stratum.counter,
        }

        const stratumUpdate: Stratum.Update = {
            stratum,
        }

        this.$emit("change", stratumUpdate);
    }

    emitDelete() {
        this.$emit("delete", this.stratum);
    }

    emitSwapUp() {
        this.$emit("swapUp", this.stratum);
    }

    emitSwapDown() {
        this.$emit("swapDown", this.stratum);
    }

    transferPropsToData() {
        const stratum = this.stratum;

        this.p_label = stratum.label;
    }

    @Lifecycle created() {
        this.transferPropsToData();
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.input {
    background: none;

    border: 0;
    border-bottom: 0.1em dashed;

    color: #fff;

    cursor: pointer;
}

.input-wrapper {
    display: inline-block;
    background: #49075E;
    padding: 0.3em 0.5em;
    border-radius: 0.3em;

    font-size: 1.5em;
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
    background-image: url("data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjOGIwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48dGl0bGU+MUFydGJvYXJkIDIxPC90aXRsZT48cGF0aCBkPSJNNTgsMjB2Nkg3NGEyLDIsMCwwLDEsMiwydjRhMiwyLDAsMCwxLTIsMkgyNmEyLDIsMCwwLDEtMi0yVjI4YTIsMiwwLDAsMSwyLTJINDJWMjBhMiwyLDAsMCwxLDItMkg1NkEyLDIsMCwwLDEsNTgsMjBaTTM0LDgySDY2YTYsNiwwLDAsMCw2LTZWNDBIMjhWNzZBNiw2LDAsMCwwLDM0LDgyWiIvPjwvc3ZnPg==");
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
