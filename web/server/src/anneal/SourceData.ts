import * as SourceData from "../../../common/SourceData";

export const checkColumnsOnlyOneId =
    (columns: SourceData.ColumnDescArray) => {
        const idCount = columns.reduce(
            (count, column) => (column.isId) ? ++count : count,
            0
        );

        return idCount === 1;
    }

export const wrapFlatRecordArrayIntoSinglePartition =
    (records: SourceData.RecordArray): SourceData.PartitionedRecordArray => {
        return [records];
    }

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
