<template>
    <div id="wizard">
        <h1>Select records file</h1>
        <p>
            Select a
            <b>CSV</b> file containing records of persons along with any attributes you would like to apply constraints to.
            <a class="more" href="#">Need help?</a>
        </p>
        <div class="bottom-buttons">
            <label v-if="!isFileSetInStore">
                <input type="file" id="load-file" accept=".csv" @change="onFileInputChanged($event)">
                <button class="button" @click.stop.prevent="openFilePicker">Select CSV file...</button>
            </label>
            <button class="button" @click="emitWizardNavNext" v-if="isFileSetInStore">Use "{{fileInStore.name}}"</button>
            <button class="button gold" @click="clearFile" v-if="isFileSetInStore">Clear file</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";
import * as Papa from "papaparse";

import * as ColumnInfo from "../../data/ColumnInfo";

@Component
export default class ProvideRecordsFile extends Vue {
    emitWizardNavNext() {
        this.$emit("wizardNavigation", {
            event: "next",
        });
    }

    clearFile() {
        // Wipe all working file/config
        this.$store.commit("initialiseSourceFile");
        this.$store.commit("initialiseConstraintsConfig");
    }

    openFilePicker() {
        document.getElementById("load-file")!.click();
    }

    get isFileSetInStore() {
        return !!this.fileInStore.data;
    }

    get fileInStore() {
        return this.$store.state.sourceFile;
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
                worker: false,          // TODO: Bug with papaparse worker + webpack; disabled for now
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
        const fileData = parseResult.data;



        // Compute column info
        const columnInfo = ColumnInfo.fromRawData(fileData);


        // Set CSV file data in store
        this.$store.commit("initialiseSourceFile");
        this.$store.commit("updateSourceFileName", fileName);
        this.$store.commit("updateSourceFileData", fileData);
        this.$store.commit("updateSourceFileColumnInfo", columnInfo);

        // Wipe existing constraints
        this.$store.commit("initialiseConstraintsConfig");



        this.emitWizardNavNext();
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#wizard {
    padding: 1rem 2rem;
}

#wizard h1 {
    color: #49075E;
    font-weight: 400;
    font-size: 2.5em;
    margin: 1rem 0;
}

#wizard p {
    margin: 1rem 0;
}

#wizard .bottom-buttons {
    background: rgba(0, 0, 0, 0.05);
    margin: 0 -2rem -1rem;
    padding: 1rem 2rem;

    display: flex;
    flex-direction: row-reverse;
}

#wizard .bottom-buttons>* {
    margin: 0 0.2em;
}

#load-file {
    display: none;
}
</style>
