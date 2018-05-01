import { allIndexOf, indexFilter } from "../util/Array";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";

export interface Partition {
    /** The actual value used to partition */
    value: number | string | null | undefined,

    /** Column data that represents all records in the partition */
    columns: ReadonlyArray<IColumnData>,

    /** 
     * Indicates whether the partition object represents a false partition.
     * 
     * Value is `true` if a partition is not set in TeamAnneal, but the
     * partition object is still required for wrapping data before being sent to
     * the server.
     */
    notTruePartition: boolean,
}

/**
 * 
 * @param value The actual value used to partition
 * @param columns Column data that represents all records in the partition
 * @param notTruePartition Whether the partition object represents a false partition (a partition only present for internal data structure purposes)
 */
export function init(value: number | string | null | undefined = undefined, columns: ReadonlyArray<IColumnData> = [], notTruePartition: boolean = false) {
    const obj: Partition = {
        value,
        columns,

        notTruePartition,
    };

    return obj;
}

export function initManyFromPartitionColumnDescriptor(columns: ReadonlyArray<IColumnData>, partitionColumnDescriptor: IColumnData_MinimalDescriptor | undefined) {
    if (partitionColumnDescriptor === undefined) {
        // No partition = return all columns as-is in one partition
        return [init(undefined, columns, true)];
    }

    const partitionColumn = ColumnData.ConvertToDataObject(columns, partitionColumnDescriptor);

    if (partitionColumn === undefined) {
        throw new Error("Could not convert partition column descriptor into data object");
    }

    // Use the value set of the partition column to split the data up
    const partitionColumnCookedValues: ReadonlyArray<number | string | null> = ColumnData.GetCookedColumnValues(partitionColumn);
    const partitionColumnValueSet: Set<number | string> = ColumnData.GetValueSet(partitionColumn);

    // Go through each distinct column value in the partition value set and
    // convert them into mapping indices
    const partitionDescArray: { partitionValue: number | string | null, recordIndices: number[] }[] = [];

    partitionColumnValueSet.forEach((val) => {
        partitionDescArray.push({
            partitionValue: val,
            recordIndices: allIndexOf(partitionColumnCookedValues, val),
        });
    });

    // If the partition column also contains a `null` value, also create a
    // partition to cover nulls as well
    if (partitionColumnCookedValues.indexOf(null) > -1) {
        partitionDescArray.push({
            partitionValue: null,
            recordIndices: allIndexOf(partitionColumnCookedValues, null),
        });
    }

    // For each partition, map out a new set of smaller partitioned columns
    const partitions =
        partitionDescArray.map(({ partitionValue, recordIndices, }) => {
            const columnsForPartition = columns.map(({ rawColumnValues, label, type }) => {
                // Extract only the raw column values relevant for this 
                // partition
                const partitionedRawColumnValues = indexFilter(rawColumnValues, recordIndices);

                // Create a new smaller, partitioned column data object
                return ColumnData.Init(partitionedRawColumnValues, label, type);
            });

            return init(partitionValue, columnsForPartition);
        });

    return partitions;
}

export function getNumberOfRecords(partition: Partition) {
    const column: IColumnData | undefined = partition.columns[0];

    if (column === undefined) {
        throw new Error("No columns in partition");
    }

    return column.rawColumnValues.length;
}
