<template>
    <div id="wizard">
        <h1>Select ID column</h1>
        <p>
            TeamAnneal needs to know which column identifies each unique record in your data.
            <a class="more" href="#">Need help?</a>
        </p>
        <p>
            <select v-model="idColumnIndex">
                <option disabled value="-1">Please select the ID column</option>
                <option v-for="option in possibleIdColumns" :value="option.value">{{ option.text }}</option>
            </select>
        </p>
        <p class="error" v-if="possibleIdColumns.length === 0">Your records file has no detected ID column to choose from. Please ensure that your records file has a column with one unique ID value per record.</p>
        <div class="bottom-buttons">
            <button class="button" @click="emitWizardNavNext" :disabled="idColumnIndex === '-1'">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as SourceFile from "../../data/SourceFile";
import * as ConstraintsConfig from "../../data/ConstraintsConfig";

@Component()
export default class SelectIdColumn extends Vue {
    emitWizardNavNext() {
        this.$emit("wizardNavigation", {
            event: "next",
        });
    }

    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    get constraintsConfigInStore() {
        const config: Partial<ConstraintsConfig.ConstraintsConfig> = this.$store.state.constraintsConfig;
        return config;
    }

    /**
     * An array for the <select /> menu of all the possible ID columns to choose 
     * from.
     */
    get possibleIdColumns() {
        const allRawData = this.fileInStore.data;
        const columnInfo = this.fileInStore.columnInfo || [];

        // No data to even process
        if (allRawData === undefined) { return []; }

        // The total number of records is equal to the full raw data array
        // length minus the header (1 row)
        const numberOfRecords = allRawData.length - 1;

        // Filter only those with column values unique
        return columnInfo
            .filter(info => info.valueSet.size === numberOfRecords)
            .map(info => ({ text: info.label, value: columnInfo.indexOf(info) }));
    }






    get idColumnIndex(): string {
        // NOTE: Returns string as <select> doesn't do numbers
        const idColumnIndex = this.constraintsConfigInStore.idColumnIndex;

        if (idColumnIndex === undefined) {
            return "-1";
        }

        return idColumnIndex.toString();
    }

    set idColumnIndex(val: string) {
        const idColumnIndex = +val;     // Convert to number 
        this.$store.commit("updateConstraintsConfigIdColumnIndex", idColumnIndex);

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

.error {
    color: red;
}
</style>
