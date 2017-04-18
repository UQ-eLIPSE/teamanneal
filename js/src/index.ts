/**
 * Prototype front end
 */

// References to libraries are assumed passively.
// Should be changed to use module imports prior to development towards a
// production system.

// import * as Config from "./Config";
// import * as Constraint from "./Constraint";
import * as SourceRecord from "./SourceRecord";
// import * as Partition from "./Partition";
// import * as Util from "./Util";
// import * as AnnealThread from "./AnnealThread";
// import * as Anneal from "./Anneal";
import * as StringMap from "./StringMap";
import * as ColumnInfo from "./ColumnInfo";
import * as ColumnDesc from "./ColumnDesc";
// import * as CostFunction from "./CostFunction";
import * as SourceRecordSet from "./SourceRecordSet";


// Elements
const $content = $("#content");
const $spreadsheet = $("#spreadsheet");
const $wizardContainer = $("#wizard-container");
const $wizard = $("#wizard");
let $loadCsvFile = $("#load-csv-file"); // This gets changed over time due to file picker reset
const $partitionColumns = $("#partition-columns");
const $teamColumnHeader = $("#team-column-header");
const $teamNameFormat = $("#team-name-format");
const $teamSizeMin = $("#team-size-min");
const $teamSizeIdeal = $("#team-size-ideal");
const $teamSizeMax = $("#team-size-max");

// Internal objects
const stringMap = StringMap.init();
let _columnInfo: ColumnInfo.ColumnInfo | undefined;
let _records: SourceRecordSet.SourceRecordSet | undefined;
let _partitionColumnIndex: number | undefined;
let _teamColumnHeader: string | undefined;
let _teamNameFormat: string | undefined;
let _teamSizeMin: number | undefined;
let _teamSizeIdeal: number | undefined;
let _teamSizeMax: number | undefined;



// Events
const onLoadCsvFileChanged = async () => {
    const fileElement = $loadCsvFile.get(0) as HTMLInputElement;
    const $button = $loadCsvFile.next();
    const buttonText = $button.text();

    // Set a small bit of text to the button to let users know something's happening
    $button.text("Just a sec...");
    $button.prop("tabindex", -1);

    // Parse
    const file = fileElement.files![0];
    const parseResult = await new Promise<PapaParse.ParseResult>((resolve, reject) => {
        Papa.parse(file, {
            dynamicTyping: true,    // Auto convert numbers
            header: false,          // Don't try to convert into objects, preserve as val[][] type
            complete: resolve,
            error: reject,
            worker: true,
        });
    });

    // Reset button
    $button.text(buttonText);
    $button.prop("tabindex", 0);

    // Bug in Edge causes infinite prompts when file element type changes from "file" -> "" -> "file"
    const $loadCsvFileReplacement = $loadCsvFile.clone();
    $loadCsvFile.replaceWith($loadCsvFileReplacement);
    $loadCsvFile = $loadCsvFileReplacement;
    const _fileElement = $loadCsvFile.get(0) as HTMLInputElement;
    _fileElement.value = "";    // Required for Chrome as cloning also clones value
    $loadCsvFile.on("change", onLoadCsvFileChanged);

    // If errors encountered
    if (parseResult.errors.length) {
        console.error(parseResult.errors);
        alert("Errors encountered during parse - see console");
        throw new Error("Errors encountered during parse");
    }

    const rawRecords: (string | number)[][] = parseResult.data;

    // TODO: Should check for string-iness
    const headers: string[] = rawRecords.shift() as string[];

    // Prepare column info and records
    const { columnInfo, records } = prepareColumnInfoAndRecords(stringMap)(headers)(rawRecords);
    _columnInfo = columnInfo;
    _records = records;

    // Load spreadsheet
    const $table = buildSpreadsheetTable(file.name)(columnInfo)(headers)(rawRecords);
    emptySpreadsheet();
    loadSpreadsheet($table);

    // Progress wizard
    wizard.doubleCheckCsv();
}

const onPartitionColumnsChanged = () => {
    const i = parseInt(($partitionColumns.get(0) as HTMLSelectElement).value);
    
    const $table = $("table", $spreadsheet);

    if (isNaN(i)) { return unhighlightColumns($table); }

    highlightColumn($table)(i);
}

$loadCsvFile.on("change", onLoadCsvFileChanged);
$partitionColumns.on("change", onPartitionColumnsChanged);





// Wizard components
const wizard = (() => {
    const load = (id: string) => {
        const $target = $(id, $wizard);
        $target.siblings().hide();
        $target.show();
    }

    return {
        _linkUpButton:
        (wizardId: string) =>
            (dataButtonId: string) =>
                (callback: (eventObject: JQueryEventObject, ...args: any[]) => any) => {
                    return $(`[data-button-id='${dataButtonId}']`, $(wizardId)).on("click", callback);
                },

        welcome: () => {
            hideSpreadsheet();
            hideBgOverlay();
            wizardContainerToSplash();
            load("#welcome");
        },

        loadCsv: () => {
            hideSpreadsheet();
            showBgOverlay();
            wizardContainerToFloat();
            load("#load-csv");
        },

        doubleCheckCsv: () => {
            unhighlightColumns($("table", $spreadsheet));
            showSpreadsheet();
            hideBgOverlay();
            wizardContainerToFloat();
            load("#double-check-csv");
        },

        setPartition: () => {
            showSpreadsheet();
            hideBgOverlay();
            wizardContainerToFloat();

            $partitionColumns.children().first().nextAll().remove();
            $partitionColumns.append(
                _columnInfo!.map(
                    (columnDesc, i) => $("<option>").prop("value", i).text(StringMap.get(stringMap)(ColumnDesc.getName(columnDesc)))
                )
            );
            
            $partitionColumns.trigger("change");

            load("#set-partition");
        },

        configureOutputTeams: () => {
            unhighlightColumns($("table", $spreadsheet));
            showSpreadsheet();
            hideBgOverlay();
            wizardContainerToFloat();

            load("#configure-output-teams");
        },

        buildConstraints: () => {
            showSpreadsheet();
            hideBgOverlay();
            wizardContainerToFloat();

            load("#build-constraints");
        },
    }
})();

wizard._linkUpButton("#welcome")("get-started")(wizard.loadCsv);

wizard._linkUpButton("#load-csv")("back")(wizard.welcome);

wizard._linkUpButton("#double-check-csv")("back")(wizard.loadCsv);
wizard._linkUpButton("#double-check-csv")("next")(wizard.setPartition);

wizard._linkUpButton("#set-partition")("back")(wizard.doubleCheckCsv);
wizard._linkUpButton("#set-partition")("skip")(() => {
    _partitionColumnIndex = undefined;
    wizard.configureOutputTeams();
});
wizard._linkUpButton("#set-partition")("next")(() => {
    _partitionColumnIndex = parseInt(($partitionColumns.get(0) as HTMLSelectElement).value);

    if (isNaN(_partitionColumnIndex)) {
        return alert("Invalid column selected");
    }

    wizard.configureOutputTeams();
});

wizard._linkUpButton("#configure-output-teams")("back")(wizard.setPartition);
wizard._linkUpButton("#configure-output-teams")("next")(() => {
    // Check validity
    if (
        !($teamColumnHeader.get(0) as HTMLInputElement).validity.valid ||
        !($teamNameFormat.get(0) as HTMLInputElement).validity.valid ||
        !($teamSizeMin.get(0) as HTMLInputElement).validity.valid ||
        !($teamSizeIdeal.get(0) as HTMLInputElement).validity.valid ||
        !($teamSizeMax.get(0) as HTMLInputElement).validity.valid) {
            alert("Invalid input");
            return;
        }

    _teamColumnHeader = $teamColumnHeader.val();
    _teamNameFormat = $teamNameFormat.val();
    _teamSizeMin = parseInt($teamSizeMin.val());
    _teamSizeIdeal = parseInt($teamSizeIdeal.val());
    _teamSizeMax = parseInt($teamSizeMax.val());

    wizard.buildConstraints();
});

wizard._linkUpButton("#build-constraints")("back")(wizard.configureOutputTeams);
// wizard._linkUpButton("#configure-output-teams")("next")(() => {

// });






const prepareColumnInfoAndRecords =
    (stringMap: StringMap.StringMap) =>
        (headers: string[]) =>
            (rawRecords: SourceRecord.RawRecord[]) => {
                // Create column info object
                const columnInfo = ColumnInfo.initFrom(stringMap)(headers)(rawRecords);

                // Convert records
                const records = SourceRecordSet.initFrom(columnInfo)(stringMap)(rawRecords);

                // Populate column info details using records above
                ColumnInfo.populateFrom(columnInfo)(records);

                return {
                    columnInfo,
                    records,
                }
            }




const buildSpreadsheetTable =
    (fileName: string) =>
        (columnInfo: ColumnInfo.ColumnInfo) =>
            (headers: string[]) =>
                (rawRecords: (string | number)[][]) => {
                    const table = $("<table>");

                    // Map out column types
                    const isNumeric = columnInfo.map(
                        columnDesc => ColumnDesc.isNumeric(columnDesc)
                    );
                    const isString = columnInfo.map(
                        columnDesc => ColumnDesc.isString(columnDesc)
                    );

                    // Build up rows
                    const fileNameRow = $("<tr>").append(
                        $("<td>", { colspan: headers.length }).text(fileName)
                    );

                    const headerRow = $("<tr>").append(
                        headers.map(
                            (cell, i) => {
                                let type: string = "?";

                                if (isNumeric[i]) {
                                    type = "num";
                                } else if (isString[i]) {
                                    type = "str";
                                }

                                return $("<th>").text(`${cell} (${type})`);
                            }
                        )
                    );

                    const recordRows = rawRecords.map(
                        row => {
                            return $("<tr>").append(
                                row.map(
                                    (cell, i) => $("<td>").text(cell).addClass(isNumeric[i] ? "num" : "")
                                )
                            );
                        }
                    );

                    table
                        .append(fileNameRow)
                        .append(headerRow)
                        .append(recordRows);

                    return table;
                }

const unhighlightColumns =
    ($table: JQuery) => {
        $(".highlight", $table).removeClass("highlight");
    }

const highlightColumn =
    ($table: JQuery) =>
        (i: number) => {
            unhighlightColumns($table);

            $("tr").each(
                (j, row) => {
                    if (j === 0) { return; }    // Skip first row
                    $(row).children().eq(i).addClass("highlight")
                }
            )
        }

const showBgOverlay = () => $content.addClass("bg-blur");
const hideBgOverlay = () => $content.removeClass("bg-blur");

const showSpreadsheet = () => $spreadsheet.removeClass("hidden");
const hideSpreadsheet = () => $spreadsheet.addClass("hidden");
const emptySpreadsheet = () => $spreadsheet.empty();
const loadSpreadsheet = (table: JQuery) => $spreadsheet.append(table);

const wizardContainerToSplash = () => $wizardContainer.removeClass("float").addClass("splash");
const wizardContainerToFloat = () => $wizardContainer.removeClass("splash").addClass("float");


// Init
wizard.welcome();
