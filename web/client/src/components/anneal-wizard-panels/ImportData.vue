<template>
    <div class="wizard-panel">
        <!-- dataImportMode = "new-records-file" -->
        <template v-if="importModeIsNewRecordsFile">
            <div class="wizard-panel-content">
                <h1>Load data file</h1>
                <p>
                    Select a
                    <b>CSV</b> file containing records of people that you would like to form teams with.
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
                <p>
                    <label>
                        <input type="file"
                               class="hidden-file-input"
                               ref="load-data-file-input"
                               accept=".csv"
                               @change="onLoadDataFileOnlyInputChanged($event)">
                        <button v-if="!isFileSetInStore"
                                class="button"
                                @click.stop.prevent="openLoadDataFilePicker">Select CSV file...</button>
                    </label>
                    <button class="button"
                            @click.prevent="null"
                            v-if="isFileSetInStore">"{{ filename }}" in use</button>
                    <button class="button gold"
                            @click="swapFile"
                            v-if="isFileSetInStore">Swap file</button>
                </p>
            </div>
            <div class="wizard-panel-bottom-buttons">
                <button class="button"
                        @click="emitWizardNavNext"
                        :disabled="!isConfigAndDataFileLoaded">Continue</button>
                <button class="button secondary"
                        @click="resetEverything">Reset everything</button>
                <button class="button secondary panel-bottom-button-align-left"
                        @click="setImportModeToImportConfigFileWithSeparateRecordsFile">Import existing configuration instead</button>
            </div>
        </template>

        <!-- dataImportMode = "import-config-file-with-separate-records-file" -->
        <template v-if="importModeIsImportConfigWithSeparateRecords">
            <div class="wizard-panel-content">
                <h1>Import existing configuration</h1>
                <p class="import-config-section-box">
                    First, select an existing TeamAnneal configuration file
                    <b>(*.taconfig)</b>:
                    <br />
                    <br />
                    <label>
                        <input type="file"
                               class="hidden-file-input"
                               ref="import-config-file-input"
                               accept=".taconfig"
                               @change="onImportConfigFileInputChanged($event)">
                        <button class="button"
                                @click.stop.prevent="openImportConfigFilePicker">Select TACONFIG file...</button>
                    </label>
                    <span class="import-config-message"
                          :class="importConfigResult.state">{{ importConfigResult.message }}</span>
                </p>
                <p class="import-config-section-box">
                    Second, select a
                    <b>CSV</b> file containing records of people that you would like to form teams with:
                    <br />
                    <br />
                    <label>
                        <input type="file"
                               class="hidden-file-input"
                               ref="load-data-file-input"
                               accept=".csv"
                               @change="onLoadDataFileInputInImportConfigChanged($event)">
                        <button v-if="!isFileSetInStore"
                                class="button"
                                @click.stop.prevent="openLoadDataFilePicker">Select CSV file...</button>
                    </label>
                    <button class="button"
                            @click.prevent="null"
                            v-if="isFileSetInStore">"{{ filename }}" in use</button>
                    <button class="button gold"
                            @click="swapFile"
                            v-if="isFileSetInStore">Swap file</button>
                </p>
            </div>
            <div class="wizard-panel-bottom-buttons">
                <button class="button"
                        @click="emitWizardNavNext"
                        :disabled="!isConfigAndDataFileLoaded">Continue</button>
                <button class="button secondary"
                        @click="resetEverything">Reset everything</button>
                <button class="button secondary panel-bottom-button-align-left"
                        @click="setImportModeToNewRecordsFile">Load data file instead</button>
            </div>
        </template>
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

    importConfigResult: { state: "success" | "failure" | undefined, message: string } = { state: undefined, message: "" };

    get importModeIsNewRecordsFile() {
        return S.state.dataImportMode === "new-records-file";
    }

    get importModeIsImportConfigWithSeparateRecords() {
        return S.state.dataImportMode === "import-config-file-with-separate-records-file";
    }

    get filename() {
        return S.state.recordData.source.name;
    }

    get isFileSetInStore() {
        return S.get(S.getter.HAS_SOURCE_FILE_DATA);
    }

    get isConfigAndDataFileLoaded() {
        return S.get(S.getter.HAS_CONFIG_AND_SOURCE_FILE_DATA);
    }

    setImportModeToNewRecordsFile() {
        // TODO: Clear data?
        S.dispatch(S.action.SET_DATA_IMPORT_MODE, "new-records-file");
    }

    setImportModeToImportConfigFileWithSeparateRecordsFile() {
        // TODO: Clear data?
        S.dispatch(S.action.SET_DATA_IMPORT_MODE, "import-config-file-with-separate-records-file");
    }

    async resetEverything() {
        await S.dispatch(S.action.RESET_STATE, undefined);

        // Also clear the import message
        this.importConfigResult = { state: undefined, message: "" };
    }

    swapFile() {
        // To swap file, just trigger data file picker again
        this.openLoadDataFilePicker();
    }

    openLoadDataFilePicker() {
        (this.$refs["load-data-file-input"] as HTMLInputElement).click();
    }

    openImportConfigFilePicker() {
        (this.$refs["import-config-file-input"] as HTMLInputElement).click();
    }

    async extractRecordDataFromInput(inputEl: HTMLInputElement) {
        const file = inputEl.files![0];
        const previousRecordData = S.state.recordData;
        return await RecordData.parseFileToRecordData(file, previousRecordData);
    }

    async onLoadDataFileInputInImportConfigChanged($event: Event) {
        const fileElement = $event.target as HTMLInputElement;
        const recordData = await this.extractRecordDataFromInput(fileElement);

        // Save to state
        await S.dispatch(S.action.SET_RECORD_DATA, recordData);
    }

    async onLoadDataFileOnlyInputChanged($event: Event) {
        const fileElement = $event.target as HTMLInputElement;
        const recordData = await this.extractRecordDataFromInput(fileElement);

        // Save to state
        // If new, init, otherwise just set
        if (S.state.recordData.source.name === undefined) {
            await S.dispatch(S.action.INIT_RECORD_DATA, recordData);
        } else {
            await S.dispatch(S.action.SET_RECORD_DATA, recordData);
        }

        // Move on to the next step
        this.emitWizardNavNext();
    }

    async onImportConfigFileInputChanged($event: Event) {
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

            await S.dispatch(S.action.HYDRATE, fileContents);

            // Deliberately set timeout for a minimum 500ms so that users can see it
            setTimeout(() => {
                this.importConfigResult = { state: "success", message: `"${file.name}" imported successfully` };
            }, 500);
        } catch {
            this.importConfigResult = { state: "failure", message: `Configuration failed to be imported` };
        }
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

.import-config-section-box {
    border: 1px solid #49075E;
    background: rgba(73, 7, 94, 0.1);
    padding: 1em;
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
</style>
