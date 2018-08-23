<template>
    <div class="import-file">
        <h2>Import</h2>
        <p>Select a TeamAnneal results package <b>(*.taresults)</b> to import:</p>
        <label>
            <input type="file"
                   accept=".taresults"
                   class="taresults-import-file"
                   ref="taresults-import-file"
                   @change="onTeamAnnealPackageFileInputChanged($event)">
            <button class="button small"
                    @click.stop.prevent="openFilePicker">Select results package...</button>
        </label>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { ResultsEditor as S } from "../../store";

@Component
export default class ImportFile extends Vue {
    openFilePicker() {
        (this.$refs["taresults-import-file"] as HTMLInputElement).click();
    }

    onTeamAnnealPackageFileInputChanged(e: Event) {
        const files = (e.target as HTMLInputElement).files;

        if (files === null) {
            return;
        }

        const selectedFile = files[0];

        if (selectedFile === undefined) {
            return;
        }

        // Read in TeamAnneal results package
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
.taresults-import-file {
    display: none;
}
</style>
