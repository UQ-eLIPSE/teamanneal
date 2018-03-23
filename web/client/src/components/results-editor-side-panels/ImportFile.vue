<template>
    <div class="import-file">
        <h2>Import</h2>
        <p>Select a *.teamanneal file to import into the editor:</p>
        <input type="file"
               @change="onFileChange($event)" />
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

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
}
</script>

<!-- ####################################################################### -->

<style scoped>

</style>
