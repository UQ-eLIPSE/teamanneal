<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Import</h1>
            <p>To use TeamAnneal, you need to import a file containing records of people. You can also optionally import an existing anneal configuration.
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
            <div class="import-split-pane-wrapper">
                <div class="import-split-pane">
                    <div class="import-section-box"
                         :class="{ 'imported': hasSourceFileData }">
                        <h3>Import records</h3>
                        <p>
                            Select a
                            <b>CSV</b> file containing records of people you would like to form teams with:
                        </p>
                        <p>
                            <!-- The use of `v-for` is a fix to force the <input> to be re-rendered -->
                            <label v-for="x in [recordFileInputElKey]"
                                   :key="x">
                                <input type="file"
                                       class="hidden-file-input"
                                       ref="record-file-input"
                                       accept=".csv"
                                       @change="onRecordFileInputChanged($event)">
                                <button v-if="!hasSourceFileData"
                                        class="button"
                                        @click.stop.prevent="openRecordFilePicker">Select CSV file...</button>
                            </label>
                            <button class="button"
                                    @click.prevent="null"
                                    v-if="hasSourceFileData">"{{ filename }}" in use</button>
                            <button class="button gold"
                                    @click="swapRecordFile"
                                    v-if="hasSourceFileData">Swap file</button>
                        </p>
                    </div>
                    <div class="import-section-box"
                         :class="{ 'imported': hasConfig }">
                        <h3>Import anneal configuration
                            <span class="font-weight-normal">(optional)</span>
                        </h3>
                        <p>
                            Select a TeamAnneal configuration
                            <b>(*.taconfig)</b> or results package
                            <b>(*.taresults)</b> file:
                        </p>
                        <p>
                            <!-- The use of `v-for` is a fix to force the <input> to be re-rendered -->
                            <label v-for="x in [configFileInputElKey]"
                                   :key="x">
                                <input type="file"
                                       class="hidden-file-input"
                                       ref="config-file-input"
                                       accept=".taconfig,.taresults"
                                       @change="onConfigFileInputChanged($event)">
                                <button class="button"
                                        @click.stop.prevent="openConfigFilePicker">Select TeamAnneal file...</button>
                            </label>
                        </p>
                        <p class="import-config-message"
                           :class="importConfigResult.state">{{ importConfigResult.message }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="emitWizardNavNext"
                    :disabled="!isConfigAndDataFileLoaded">Continue</button>
            <button class="button secondary panel-bottom-button-align-left"
                    @click="resetEverything">Reset everything</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import * as RecordData from "../../data/RecordData";
import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";

import { AnnealCreator as S } from "../../store";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

@Component
export default class ImportData extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.importData;

    /** Key to trigger re-render of record file input element */
    recordFileInputElKey: number = 0;

    /** Key to trigger re-render of config file input element */
    configFileInputElKey: number = 0;

    /** Object representing the configuration import result message */
    importConfigResult: { state: "success" | "failure" | undefined, message: string } = { state: undefined, message: "" };

    get filename() {
        return S.state.recordData.source.name;
    }

    get hasConfig() {
        return S.get(S.getter.HAS_CONFIG);
    }

    get hasSourceFileData() {
        return S.get(S.getter.HAS_SOURCE_FILE_DATA);
    }

    get isConfigAndDataFileLoaded() {
        return S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA);
    }

    async resetEverything() {
        await S.dispatch(S.action.RESET_STATE, undefined);

        // Also clear the import message
        this.importConfigResult = { state: undefined, message: "" };
    }

    swapRecordFile() {
        // To swap file, just trigger record file picker again
        this.openRecordFilePicker();
    }

    openRecordFilePicker() {
        // Note that because of the `v-for` fix to re-render the element, the 
        // ref for this is an array
        (this.$refs["record-file-input"] as HTMLInputElement[])[0].click();
    }

    openConfigFilePicker() {
        // Note that because of the `v-for` fix to re-render the element, the 
        // ref for this is an array
        (this.$refs["config-file-input"] as HTMLInputElement[])[0].click();
    }

    async extractRecordDataFromInput(inputEl: HTMLInputElement) {
        const file = inputEl.files![0];
        const previousRecordData = S.state.recordData;
        return await RecordData.parseFileToRecordData(file, previousRecordData);
    }

    async onRecordFileInputChanged($event: Event) {
        const fileElement = $event.target as HTMLInputElement;
        const recordData = await this.extractRecordDataFromInput(fileElement);

        // Save to state
        // If some record file or config is set, then only set the record data
        // in
        if (this.hasConfig || this.hasSourceFileData) {
            await S.dispatch(S.action.SET_RECORD_DATA, recordData);
        } else {
            await S.dispatch(S.action.INIT_RECORD_DATA, recordData);
        }

        // Toggle key to force input element re-render
        this.recordFileInputElKey ^= 1;
    }

    async onConfigFileInputChanged($event: Event) {
        // Get file
        const fileElement = $event.target as HTMLInputElement;
        const file: File | undefined = fileElement.files![0];

        if (file === undefined) {
            this.importConfigResult = { state: undefined, message: `No file selected` };
            return;
        }

        // Set import config message to "in progress" state
        this.importConfigResult = { state: undefined, message: "Importing..." };

        try {
            // Read file contents into state
            const fileContents = await new Promise<string>((resolve, reject) => {
                // Set up reader
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = (e) => reject(e);

                // Commence reading
                reader.readAsText(file);
            });

            await S.dispatch(S.action.HYDRATE, { dehydratedState: fileContents, keepExistingRecordData: true, });

            this.importConfigResult = { state: "success", message: `"${file.name}" imported successfully` };
        } catch {
            this.importConfigResult = { state: "failure", message: `Configuration failed to be imported` };
        }

        // Toggle key to force input element re-render
        this.configFileInputElKey ^= 1;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.hidden-file-input {
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

.import-split-pane-wrapper {
    display: block;
    margin: 1rem 0;
}

.import-split-pane {
    display: inline-flex;
    max-width: 100%;
    flex-direction: row;
    align-items: stretch;
    align-content: flex-start;

    counter-reset: panel-number;
    list-style-type: decimal;
}

.import-section-box {
    border: 1px solid #49075E;
    background: rgba(73, 7, 94, 0.1);
    padding: 1.2em 1.2em 1.2em 3.5em;
    margin-left: 1em;

    position: relative;
    z-index: 0;

    flex-basis: 0;
    flex-shrink: 0;
    flex-grow: 1;

    width: 30em;
    overflow: hidden;
}

.import-section-box:first-child {
    margin-left: 0;
}

.import-section-box::before {
    counter-increment: panel-number;
    content: counter(panel-number);
    display: inline-block;
    width: 0.9em;
    text-align: center;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    font-size: 4em;
    font-weight: bold;
    line-height: 1;
    color: #fff;
}

.import-section-box.imported {
    border-color: rgb(73, 150, 94);
    background: rgba(73, 150, 94, 0.1);
}

.import-section-box>h3 {
    margin-top: 0;
}

.panel-bottom-button-align-left {
    margin-right: auto;
}

.import-config-message {
    display: inline-block;
    margin: 0.5em;
}

.import-config-message.success {
    color: green;
    font-weight: bold;
}

.import-config-message.failure {
    color: darkred;
    font-weight: bold;
}

.font-weight-normal {
    font-weight: normal;
}
</style>
