import * as Record from "./Record";
import * as SourceDataColumn from "./SourceDataColumn";

export type RecordArray = ReadonlyArray<Record.Record>;
export type PartitionedRecordArray = ReadonlyArray<RecordArray>;

export interface NonPartitioned {
    /** Flat array of records */
    readonly records: RecordArray,
    /** Indicates records are *not* split for parallel processing */
    readonly isPartitioned: false,
}

export interface Partitioned {
    /** 
     * Array of an array of records
     * 
     * This is as a result of being "partitioned", which is when the record set
     * is already split in such a way that it can be processed in parallel
     */
    readonly records: PartitionedRecordArray,
    /** Indicates records are already split for parallel processing */
    readonly isPartitioned: true,
}
export interface DescBase {
    /** Describes all columns */
    readonly columns: SourceDataColumn.ColumnDescArray,
}

export type Desc = DescBase & (
    NonPartitioned |
    Partitioned
);
