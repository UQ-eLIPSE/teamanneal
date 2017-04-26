import * as SourceData from "../../../common/SourceData";
import { ValueMessageReturn } from "../../../common/ValueMessageReturn";

/**
 * Checks source data is valid.
 */
export const checkValidity =
    (sourceData: SourceData.Desc): ValueMessageReturn<boolean> => {
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
export const checkColumnsOnlyOneId =
    (columns: SourceData.ColumnDescArray) => {
        const idCount = columns.reduce(
            (count, column) => (column.isId) ? ++count : count,
            0
        );

        return idCount === 1;
    }

/**
 * Wraps flat array of records into one single partition.
 */
export const wrapFlatRecordArrayIntoSinglePartition =
    (records: SourceData.RecordArray): SourceData.PartitionedRecordArray => {
        return [records];
    }

/**
 * Converts source data object into one with partitioned records.
 */
export const convertToPartitionedRecordArrayDesc =
    (sourceData: SourceData.Desc) => {
        // If already partitioned, return itself
        if (sourceData.isPartitioned) {
            return sourceData;
        }

        // Create new source data object with wrapped records as partition
        const newSourceData: SourceData.Desc = {
            columns: sourceData.columns,
            records: wrapFlatRecordArrayIntoSinglePartition(sourceData.records),
            isPartitioned: true,
        }

        return newSourceData;
    }
