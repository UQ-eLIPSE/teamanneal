<template>
    <div class="import-file">
        <h2>Import</h2>
        <p>Select a TeamAnneal package (*.tapackage) to import:</p>
        <label>
            <input type="file"
                   accept=".tapackage"
                   class="teamanneal-package-input"
                   ref="teamanneal-package-input"
                   @change="onTeamAnnealPackageFileInputChanged($event)">
            <button class="button small"
                    @click.stop.prevent="openFilePicker">Select TeamAnneal package...</button>
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
        (this.$refs["teamanneal-package-input"] as HTMLInputElement).click();
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
.teamanneal-package-input {
    display: none;
}
</style>
