import * as SourceRecord from "./SourceRecord";
import * as Group from "./Group";
import * as ColumnInfo from "./ColumnInfo";


export interface Partition {
    readonly name: string,
    readonly filter?: Filter,
    readonly records: SourceRecord.Set,
}

export interface Filter {
    readonly column: string,
    readonly filterVal: SourceRecord.Value,
}

interface PartitionGroup {
    readonly groups: Group.Set;
}

export type PartitionWithGroup = Partition & PartitionGroup;



export const createPartitions =
    (column: string | null) =>
        (sourceRecordSet: SourceRecord.Set) => {
            // If no column provided, return one partition with all records
            if (!column) {
                const partition: Partition = {
                    name: "",
                    records: sourceRecordSet,
                }

                return [
                    partition,
                ];
            }

            // Get all the unique values available in the selected column
            const columnValues = [...ColumnInfo.getColumnValueSet(sourceRecordSet)(column)];

            // Create partitions along those unique column values
            const extractPartitionByColVal = extractPartition(sourceRecordSet)(column);

            return columnValues.map(
                extractPartitionByColVal
            );
        }

export const extractPartition =
    (sourceRecordSet: SourceRecord.Set) =>
        (column: string) =>
            (filterVal: SourceRecord.Value) => {
                // Create Partition object with filtered records
                const partition: Partition = {
                    name: `${filterVal}`,

                    filter: {
                        column,
                        filterVal,
                    },

                    records: sourceRecordSet.filter(
                        filterFunc_objExactMatch(column)(filterVal)
                    ),
                }

                return partition;
            }

export const filterFunc_objExactMatch =
    (key: string) =>
        <T>(value: T) => {
            // Return filtering function
            return (obj: { [key: string]: T }) => obj[key] === value;
        }

export const getRecordsOfPartition =
    (partition: Partition) =>
        partition.records;

export const getSizeOfPartition =
    (partition: Partition) =>
        getRecordsOfPartition(partition).length;

export const attachGroupsToPartition =
    (partition: Partition) =>
        (groups: Group.Set) => {
            // Shove all existing properties in, plus `groups`
            const partitionWithGroup: PartitionWithGroup = {
                ...partition,
                groups,
            }

            return partitionWithGroup;
        }
