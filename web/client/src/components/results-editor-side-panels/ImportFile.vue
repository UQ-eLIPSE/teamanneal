<template>
    <div class="import-file">
        <h2>Import</h2>
        <p>Select a *.teamanneal file to import into the editor:</p>
        <input type="file"
               @change="onFileChange($event)" />
        <!-- TODO: Requires review; remove upon release -->
        <hr>
        <h3>Temporary advanced features</h3>
        <button @click="clearResultsEditorState">Clear results editor</button>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as Store from "../../store";

@Component
export default class ImportFile extends Vue {
    onFileChange(e: Event) {
        const files = (e.target as HTMLInputElement).files;

        if (files === null) {
            return;
        }

        const selectedFile = files[0];

        if (selectedFile === undefined) {
            return;
        }
    }

    clearResultsEditorState() {
        Store.ResultsEditor.dispatch(Store.ResultsEditor.action.RESET_STATE, undefined);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
