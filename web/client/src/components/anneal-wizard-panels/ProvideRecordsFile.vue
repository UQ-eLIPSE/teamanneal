<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Select records file</h1>
            <p>
                Select a
                <b>CSV</b> file containing records of persons, along with any attributes you would like to apply constraints to.
                <a class="more help-link"
                   :class="{'active': showHelp}"
                   href="#"
                   @click.prevent="toggleHelp">Need help?</a>
            </p>
            <div class="help-box"
                 v-if="showHelp">
                <h2>Where to get data from</h2>
                <p>You can obtain CSV files from most common data sources, such as Blackboard. Look for a "Export" or "Download" feature, and select "CSV" as the output format.</p>
                <p>Spreadsheet software, such as Microsoft Excel, are also able to save files as CSV.</p>
    
                <h2>How data should be formatted</h2>
                <ul>
                    <li>Your CSV file should have fields which are comma-separated (,)</li>
                    <li>The first row
                        <em>must</em> contain the headers of the data set</li>
                    <li>Each record should sit on one line</li>
                </ul>
                <p>For example:</p>
                <div class="example-data">
                    StudentID,Last Name,First Name,Discipline,Gender,GPA
                    <br> 40587853,Lueilwitz,Earnestine,Electrical,Male,5.56
                    <br> 40433178,Heller,Sarah,Mechanical,Female,6.11
                    <br> 40341654,Jewess,Corbin,Software,Male,4.98
                    <br> 40168610,Kutch,Jessica,Mechatronic,Female,5.29
                    <br> ...
                </div>
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
                    v-if="isFileSetInStore">Use "{{state.recordData.source.name}}"</button>
            <button class="button gold"
                    @click="clearFile"
                    v-if="isFileSetInStore">Clear file</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import { parseFile } from "../../data/CSV";
import { fillGaps, transpose } from "../../util/Array";

import { ColumnData } from "../../data/ColumnData";
import { State, Data as IState } from "../../data/State";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class ProvideRecordsFile extends Mixin<AnnealProcessWizardPanel>(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.provideRecordsFile;

    get state() {
        return this.$store.state as IState;
    }

    async clearFile() {
        await this.$store.dispatch("clearRecordData");
    }

    openFilePicker() {
        document.getElementById("load-file")!.click();
    }

    get isFileSetInStore() {
        return TeamAnnealState.hasSourceFileData(this.state);
    }

    async onFileInputChanged($event: Event) {
        const fileElement = $event.target as HTMLInputElement;

        // Parse
        const file = fileElement.files![0];
        const parseResult = await parseFile(file);

        // Convert rows with strings into columns
        const rows: string[][] = parseResult.data;
        fillGaps(rows);     // Fill gaps in file data array to make it rectangular

        const columns =
            transpose(rows)    // Transpose rows into columns
                .map((columnValues) => {
                    // First value is always assumed to be the column label 
                    // (the header string)
                    const label = "" + columnValues.shift();

                    // Initialise a new ColumnData object
                    // Remember that the shift pops off the header value from 
                    // the column values
                    return ColumnData.Init(columnValues, label);
                });

        // Generate record data to store into state
        const recordData = State.GenerateBlankRecordData();
        recordData.source.name = file.name;
        recordData.source.length = rows.length;
        recordData.columns = columns;

        // Save to state
        await this.$store.dispatch("setNewRecordData", recordData);

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

.example-data {
    display: inline-block;
    font-family: monospace;

    padding: 0.5em 0.7em;

    background: #ddd;
    border: 1px solid #aaa;
    border-radius: 0.5em;
}
</style>
