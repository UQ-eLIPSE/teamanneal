<template>
    <div class="swap-people">
        <h2>Swap</h2>
        <div class="form-block">
            <label for="source-person-select">Swap:</label>
            <div class="click-input-field-block">
                <button id="source-person-select"
                        class="input-field"
                        data-placeholder-text="(Person)"></button>
                <button>View</button>
                <button>Clear</button>
            </div>
        </div>
        <div class="form-block">
            <label for="target-group-select">... with:</label>
            <div class="click-input-field-block">
                <button id="target-group-select"
                        class="input-field"
                        data-placeholder-text="(Person)"></button>
                <button>View</button>
                <button>Clear</button>
            </div>
        </div>
        <div class="form-block">
            <button class="button secondary small">Advanced...</button>
        </div>
        <div class="form-block"
             style="text-align: right;">
            <button class="button small">Swap</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class Swap extends Vue {
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
