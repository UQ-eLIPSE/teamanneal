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
        <div class="bottom-buttons">
            <button class="button" @click="goToSelectPartitionColumn" :disabled="idColumnIndex === '-1'">Continue</button>
            <button class="button secondary" @click="goBack">Back</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as SourceFile from "../../data/SourceFile";
import * as ConstraintsConfig from "../../data/ConstraintsConfig";

// TODO: If only one possible ID column then immediately proceed by
// replacing current location with next


@Component()
export default class SelectIdColumn extends Vue {
    goBack() {
        this.$router.back();
    }

    goToSelectPartitionColumn() {
        this.$router.push({
            path: "select-partition-column",
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

    get possibleIdColumns() {
        const columnInfo = this.fileInStore.columnInfo || [];

        // TODO: Filter only those with column values unique

        return columnInfo.map((info, i) => ({ text: info.label, value: i }));
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

#wizard .bottom-buttons :last-child {
    margin-right: auto;
}
</style>
