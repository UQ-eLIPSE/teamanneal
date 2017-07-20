<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Select records file</h1>
            <p>
                Select a
                <b>CSV</b> file containing records of persons along with any attributes you would like to apply constraints to.
                <a class="more"
                   href="#">Need help?</a>
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <label v-if="!isFileSetInStore">
                <input type="file"
                       id="load-file"
                       accept=".csv"
                       @change="onFileInputChanged($event)">
                <button class="button"
                        @click.stop.prevent="openFilePicker">Select CSV file...</button>
            </label>
            <button class="button"
                    @click="emitWizardNavNext"
                    v-if="isFileSetInStore">Use "{{fileInStore.name}}"</button>
            <button class="button gold"
                    @click="clearFile"
                    v-if="isFileSetInStore">Clear file</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import * as UUID from "../../data/UUID";
import * as Stratum from "../../data/Stratum";
import * as SourceFile from "../../data/SourceFile";
import * as ColumnInfo from "../../data/ColumnInfo";
import * as CookedData from "../../data/CookedData";
import * as TeamAnnealState from "../../data/TeamAnnealState";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class ProvideRecordsFile extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.provideRecordsFile;

    clearFile() {
        // Wipe all working file/config
        this.$store.commit("initialiseSourceFile");
        this.$store.commit("initialiseConstraintsConfig");
    }

    openFilePicker() {
        document.getElementById("load-file")!.click();
    }

    get isFileSetInStore() {
        return TeamAnnealState.hasSourceFileData(this.$store.state);
    }

    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    async onFileInputChanged($event: Event) {
        const fileElement = $event.target as HTMLInputElement;

        // Parse
        const file = fileElement.files![0];
        const parseResult = await SourceFile.parseCsvFile(file);
        const fileData: ReadonlyArray<ReadonlyArray<string | number>> = parseResult.data;

        // Compute column info
        // TODO: Check for header-ness/stringiness
        const headers = fileData[0] as string[];
        let columnInfo: ReadonlyArray<ColumnInfo.ColumnInfo>;

        try {
            columnInfo = ColumnInfo.fromRawData(headers, fileData, true);
        } catch (e) {
            // Show error to user
            alert(e.toString());
            return;
        }


        // Shorthand for this.$store.commit
        const c = this.$store.commit;

        // Set CSV file data in store
        c("initialiseSourceFile");
        c("updateSourceFileName", file.name);
        c("updateSourceFileRawData", fileData);
        c("updateSourceFileCookedData", CookedData.cook(columnInfo, fileData, true));
        c("updateSourceFileColumnInfo", columnInfo);

        // Wipe existing data
        c("initialiseConstraintsConfig");
        c("initialiseAnnealAjax");
        c("initialiseAnnealInputOutput");

        // Add a generic stratum now for users to get started with
        const genericStratum: Stratum.Stratum = {
            _id: UUID.generate(),
            label: "Team",
            size: {
                min: 2,
                ideal: 3,
                max: 4,
            },
            counter: "decimal",
        }
        c("insertConstraintsConfigStrata", genericStratum);

        // Move on to the next step
        this.emitWizardNavNext();
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.wizard-panel {
    display: flex;
    flex-direction: column;
}

.wizard-panel-content {
    flex-grow: 0;
    flex-shrink: 1;

    padding: 1rem 2rem;

    overflow-y: auto;
}

.wizard-panel-content h1 {
    color: #49075E;
    font-weight: 400;
    font-size: 2.5em;
    margin: 1rem 0;
}

.wizard-panel-content p {
    margin: 1rem 0;
}

.wizard-panel-bottom-buttons {
    flex-grow: 0;
    flex-shrink: 0;

    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    background: #e6e6e6;
    padding: 1rem 2rem;

    margin-bottom: -1px;

    display: flex;
    flex-direction: row-reverse;
}

.wizard-panel-bottom-buttons>* {
    margin: 0 0.2em;
}

#load-file {
    display: none;
}
</style>
