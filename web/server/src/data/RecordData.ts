import * as Record from "../../../common/Record";
import * as RecordData from "../../../common/RecordData";
import * as RecordDataColumn from "../../../common/RecordDataColumn";
import { ValueMessageReturn } from "../../../common/ValueMessageReturn";

/**
 * Checks source data is valid.
 */
export function checkValidity(sourceData: RecordData.Desc): ValueMessageReturn<boolean> {
    /** Returns ValueMessageReturn<false> with specified message */
    const msgFalse = (message: string): ValueMessageReturn<false> =>
        ({
            value: false,
            message,
        });

    // Check that we only have one and only one ID column
    if (!checkColumnsOnlyOneId(sourceData.columns)) {
        return msgFalse("There must be one and only one column tagged as an identifier");
    }

    // Check that all records have the same number of expected columns
    if (!checkRecordsHaveExpectedNumberOfColumns(sourceData.columns.length, sourceData.records)) {
        return msgFalse("All records must have the same number of columns as the number of columns supplied");
    }

    return {
        value: true,
        message: undefined,
    }
}

/**
 * Checks that only one column is flagged as an identifier.
 */
export function checkColumnsOnlyOneId(columns: RecordDataColumn.ColumnDescArray) {
    const idCount = columns.reduce(
        (count, column) => (column.isId) ? ++count : count,
        0
    );

    return idCount === 1;
}

/**
 * Checks all records have expected number of columns.
 */
export function checkRecordsHaveExpectedNumberOfColumns(expectedNumberOfColumns: number, records: Record.RecordSet) {
    for (let record of records) {
        if (record.length !== expectedNumberOfColumns) {
            return false;
        }
    }

    return true;
}

export function extractDataFromColumn(records: Record.RecordSet, columnIndex: number): ReadonlyArray<Record.RecordElement> {
    return records.map(record => record[columnIndex]);
}
