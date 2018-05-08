<template>
    <div class="export-file">
        <h2>Export</h2>
        <div class="export-option-block">
            <h3>Export TeamAnneal package</h3>
            <p>Select this option to get a file that contains all data, teams, constraints and other settings, allowing you to return to review teams and make changes in future.</p>
            <p>This file can only be opened within the TeamAnneal application.</p>
            <button class="button small"
                    @click="onExportPackageButtonClick">Export package</button>
        </div>
        <div class="export-option-block">
            <h3>Export only teams (CSV)</h3>
            <p>Select this option to get a file that contains only annealed team information.</p>
            <p>This file can be opened in any spreadsheet application.</p>
            <button class="button small gold"
                    @click="onExportCsvButtonClick">Export CSV</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { ResultsEditor as S } from "../../store";

import * as FileSaver from "file-saver";

@Component
export default class ExportFile extends Vue {
    async onExportPackageButtonClick() {
        // Get state serialised and save as TeamAnneal package 
        // (just a JSON file internally)
        const serialisedContent = await S.dispatch(S.action.DEHYDRATE, { deleteSideToolAreaActiveItem: true });

        const fileBlob = new Blob([serialisedContent], { type: "application/json" });

        FileSaver.saveAs(fileBlob, `export-${Date.now()}.tapackage`, true);
    }

    onExportCsvButtonClick() {
        // TODO: Implement exporting
        throw new Error("Not implemented");
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>
.export-option-block {
    border: 1px solid #49075E;
    background: rgba(73, 7, 94, 0.1);

    padding: 1em;
    margin-bottom: 1em;
}

.export-option-block>h3 {
    color: #49075E;
    margin-top: 0;
}
</style>
