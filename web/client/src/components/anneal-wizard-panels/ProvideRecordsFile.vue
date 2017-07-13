<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Select records file</h1>
            <p>
                Select a
                <b>CSV</b> file containing records of persons along with any attributes you would like to apply constraints to.
                <a class="more"
                   href="#"
                   @click.prevent="toggleHelp">Need help?</a>
            </p>
            <div class="help-box"
                 v-if="showHelp">
                <h2>Where to get data from</h2>
                <p>You can obtain CSV files from most common data sources, such as Blackboard. Look for the "export" feature, and select "CSV" as the output format.</p>
                <p>Spreadsheet programs, such as Microsoft Excel, are also able to save files as CSV.</p>
            </div>
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
import * as Papa from "papaparse";

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
        console.log("Parsing...");
        const file = fileElement.files![0];
        const parseResult = await new Promise<PapaParse.ParseResult>((resolve, reject) => {
            Papa.parse(file, {
                dynamicTyping: true,    // Auto convert numbers
                header: false,          // Don't try to convert into objects, preserve as val[][] type
                complete: resolve,
                error: reject,
                worker: false,          // DO NOT use web workers, as there is a problem with Webpack, papaparse and workers
                skipEmptyLines: true,
            });
        });
        console.log("Parse complete");

        // If errors encountered
        if (parseResult.errors.length) {
            console.error(parseResult.errors);
            alert("Errors encountered during parse - see console");
            throw new Error("Errors encountered during parse");
        }



        const fileName = file.name;
        const fileData: ReadonlyArray<ReadonlyArray<string | number>> = parseResult.data;



        // Compute column info
        // TODO: Check for header-ness/stringiness
        const headers = fileData[0] as string[];
        const columnInfo = ColumnInfo.fromRawData(headers, fileData, true);


        // Shorthand for this.$store.commit
        const c = this.$store.commit;

        // Set CSV file data in store
        c("initialiseSourceFile");
        c("updateSourceFileName", fileName);
        c("updateSourceFileRawData", fileData);
        c("updateSourceFileCookedData", CookedData.cook(columnInfo, fileData, true));
        c("updateSourceFileColumnInfo", columnInfo);

        // Wipe existing data
        c("initialiseConstraintsConfig");
        c("initialiseAnnealAjax");
        c("initialiseAnnealInputOutput");

        // Add a generic stratum now for users to get started with
        const genericStratum: Stratum.Stratum = {
            _id: performance.now(),
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

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
#load-file {
    display: none;
}
</style>
