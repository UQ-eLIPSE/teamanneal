<template>
    <div class="export-file">
        <h2>Export</h2>
        <div class="export-option-block">
            <h3>Export TeamAnneal results package</h3>
            <p>Select this option to get a file that contains all data, including teams, needed for you to review teams and make changes in future.</p>
            <p>This
                <em>does not</em> contain your complete original anneal configuration.</p>
            <p>This file can only be opened within the TeamAnneal application.</p>
            <button class="button small"
                    @click="onExportResultsPackageButtonClick">Export results package</button>
        </div>
        <div class="export-option-block">
            <h3>Export only teams (CSV)</h3>
            <p>Select this option to get a CSV file that contains only annealed team information. This is formatted as all your existing record data with columns appended with team names.</p>
            <p>This file can be opened in any spreadsheet application.</p>
            <button class="button small gold"
                    @click="onExportCsvButtonClick">Export CSV</button>
        </div>
        <!-- TODO: Only show this block when anneal config detected -->
        <div class="export-option-block">
            <h3>Export TeamAnneal configuration</h3>
            <p>Select this option to export your anneal configuration as set in the TeamAnneal Creator. You can use this file to store and share your original set of parameters.</p>
            <p>This file can only be opened within the TeamAnneal application.</p>
            <button class="button small secondary"
                    @click="onExportConfigButtonClick">Export configuration</button>
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
    async onExportResultsPackageButtonClick() {
        // Get state serialised and save as TeamAnneal results package 
        // (just a JSON file internally)
        const serialisedContent = await S.dispatch(S.action.DEHYDRATE, { deleteSideToolAreaActiveItem: true });

        const fileBlob = new Blob([serialisedContent], { type: "application/json" });

        FileSaver.saveAs(fileBlob, `export-${Date.now()}.taresults`, true);
    }

    onExportCsvButtonClick() {
        // TODO: Implement exporting
        throw new Error("Not implemented");
    }

    onExportConfigButtonClick() {
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
