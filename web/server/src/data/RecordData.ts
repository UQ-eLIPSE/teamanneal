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
