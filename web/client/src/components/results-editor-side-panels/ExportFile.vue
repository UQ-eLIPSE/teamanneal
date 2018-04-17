<template>
    <div class="export-file">
        <h2>Export</h2>
        <!-- TODO: Placeholder wording only; wording needs to be reviewed -->
        <p>Choose between exporting a TeamAnneal data package or just a CSV group list file:</p>
        <p>
            <button class="button"
                    @click="onExportButtonClick">Export *.TEAMANNEAL</button>
            <button class="button gold"
                    @click="onExportButtonClick">Export CSV</button>
        </p>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class ExportFile extends Vue {
    onExportButtonClick() {
        // TODO: Implement exporting
        throw new Error("Not implemented");
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
