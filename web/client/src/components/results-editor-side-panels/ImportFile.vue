<template>
    <div class="import-file">
        <h2>Import</h2>
        <p>Select a TeamAnneal package file (*.teamanneal) to import:</p>
        <input type="file"
               accept=".teamanneal"
               @change="onFileChange($event)" />
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { ResultsEditor as S } from "../../store";

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

        // Read in TeamAnneal package
        const reader = new FileReader();

        reader.onload = (e) => {
            const data: string = (e.target as FileReader).result;
            S.dispatch(S.action.HYDRATE, data);
        }

        reader.readAsText(selectedFile);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
