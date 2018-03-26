<template>
    <div class="move-person">
        <h2>Move</h2>
        <div class="form-block">
            <label for="source-person-select">Move:</label>
            <div class="click-input-field-block">
                <button id="source-person-select"
                        class="input-field"
                        data-placeholder-text="(Person)"></button>
                <button>View</button>
                <button>Clear</button>
            </div>
        </div>
        <div class="form-block">
            <label for="target-group-select">... to:</label>
            <div class="click-input-field-block">
                <button id="target-group-select"
                        class="input-field"
                        data-placeholder-text="(Group)"></button>
                <button>View</button>
                <button>Clear</button>
            </div>
        </div>
        <div class="form-block">
            <button class="button secondary small">Advanced...</button>
        </div>
        <div class="form-block"
             style="text-align: right;">
            <button class="button small">Move</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class Move extends Vue {
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>
.form-block {
    margin: 1em 0;
}

.click-input-field-block {
    display: flex;
    flex-direction: row;

    background: #fff;
    color: inherit;
    border: 1px solid;
}

.click-input-field-block>button {
    flex-grow: 0;
    flex-shrink: 0;

    font: inherit;
    color: inherit;
    background: none;
    text-align: inherit;
    text-decoration: none;

    border: 0;
    margin: 0;
    padding: 0.3em;
}

.click-input-field-block>button.input-field {
    flex-grow: 1;
}

.click-input-field-block>button.input-field:empty {
    font-style: italic;
    color: #888;
}

.click-input-field-block>button.input-field:empty::before {
    content: attr(data-placeholder-text);
}
</style>
