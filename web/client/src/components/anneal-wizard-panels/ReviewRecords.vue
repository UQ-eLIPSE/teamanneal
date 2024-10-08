<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <div class="desc-text">
                <h1>Review record data</h1>
                <p>
                    Take a moment to make sure all records are correct.
                    <a class="more help-link"
                       :class="{'active': showHelp}"
                       href="#"
                       @click.prevent="toggleHelp">Need help?</a>
                </p>
                <p>If you need to reload the file, simply click on the file name in the sidebar, click "Swap File" and try again.</p>
                <div class="help-box"
                     v-if="showHelp">
                    <h2>Bad or incorrectly parsed data</h2>
                    <p>If the content in the viewer below appears to be invalid, check that your input CSV file is correctly formatted, reload the file and try again.</p>
                    <p>If you continue to encounter issues,
                        <a href="https://www.elipse.uq.edu.au/"
                           target="_blank">contact eLIPSE</a>.</p>
                </div>

                <div v-if="hasDuplicateColumnNames"
                     class="error-msg">
                    <h3>Duplicate column names detected</h3>
                    <p>Please change the below columns in your data file to ensure that you have unique column names.</p>
                    <ul>
                        <li v-for="x in duplicateColumnListMessage"
                            :key="x.label">Found duplicated column name
                            <b>{{ x.label }}</b> at columns: {{ x.columnIndicies.join(", ") }}.
                        </li>
                    </ul>
                </div>
            </div>
            <div class="spreadsheet">
                <SpreadsheetTreeView2 class="viewer"
                                      :headerRow="headerRow"
                                      :headerStyles="headerStyles"
                                      :recordRows="cookedDataRows">
                </SpreadsheetTreeView2>
            </div>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    :disabled="isWizardNavNextDisabled"
                    @click="emitWizardNavNext">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

import { AnnealCreator as S } from "../../store";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";
import { ColumnData, Data as IColumnData } from "../../data/ColumnData";

import { numberSort } from "../../util/Array";

import SpreadsheetTreeView2 from "../SpreadsheetTreeView2.vue";

interface ColumnIndexInfo {
    column: IColumnData,
    index: number,
}

@Component({
    components: {
        SpreadsheetTreeView2,
    },
})
export default class ReviewRecords extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.reviewRecords;

    get columns() {
        return S.state.recordData.source.columns;
    }

    get cookedDataWithHeader() {
        return ColumnData.TransposeIntoCookedValueRowArray(this.columns, true);
    }

    get cookedDataRows() {
        // Just return the rows, not including the header
        return this.cookedDataWithHeader.slice(1);
    }

    get headerRow() {
        // Return just the header
        return this.cookedDataWithHeader[0].map(x => "" + x);
    }

    get headerStyles() {
        const duplicateColumnIndices = this.duplicateColumnIndices;

        return this.headerRow.map((_header, i) => {
            if (duplicateColumnIndices.indexOf(i) !== -1) {
                // If header is for duplicate column, format as warning
                return {
                    color: "#000",
                    backgroundColor: "darkorange",
                };
            };

            // Otherwise no styles
            return undefined;
        });
    }

    get hasDuplicateColumnNames() {
        return S.get(S.getter.HAS_DUPLICATE_COLUMN_NAMES);
    }

    get columnIndexInfoMap() {
        return this.columns.reduce((map, column, index) => {
            if (!map.has(column.label)) {
                map.set(column.label, []);
            }

            // Get the previous array of columns with the same label
            const columnsWithSameLabel = map.get(column.label)!;

            // Push this column in
            columnsWithSameLabel.push({ column, index });

            return map;
        }, new Map<string, ColumnIndexInfo[]>());
    }

    /** 
     * Returns columns which have duplicate labels
     */
    get duplicateColumnIndices() {
        const duplicateColumnIndexInfo: ColumnIndexInfo[] = [];

        this.columnIndexInfoMap.forEach((colInfo) => {
            if (colInfo.length > 1) {
                duplicateColumnIndexInfo.push(...colInfo);
            }
        });

        return duplicateColumnIndexInfo.map(x => x.index);
    }

    /** 
     * Returns messages describing the column numbers of duplicate column names
     */
    get duplicateColumnListMessage() {
        const messageObjs: { label: string, columnIndicies: number[] }[] = [];

        this.columnIndexInfoMap.forEach((colInfo, label) => {
            if (colInfo.length > 1) {
                const columnIndicies = colInfo.map(y => y.index + 1);
                numberSort(columnIndicies);

                messageObjs.push({
                    label,
                    columnIndicies,
                });
            }
        });

        return messageObjs;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.wizard-panel-content {
    display: flex;
    flex-direction: column;

    flex-grow: 1;

    padding: 0;
}

.desc-text {
    padding: 1rem 2rem;

    flex-grow: 0;
    flex-shrink: 0;
}

.spreadsheet {
    background: #fff;

    flex-grow: 1;
    flex-shrink: 0;

    position: relative;
}

.spreadsheet .viewer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.change-column {
    background: #3a7dda;
    padding: 0.3em 0.6em;

    color: #fff;
    font-size: 0.8em;
}

.change-column:hover,
.change-column:focus,
.change-column:active {
    background: #175ab7;
}

.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
