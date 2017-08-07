import { allIndexOf, indexFilter } from "../util/Array";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./ColumnData";

export interface Data {
    columns: ReadonlyArray<IColumnData>,
}

export namespace Partition {
    export function Init(columns: ReadonlyArray<IColumnData>) {
        const partition: Data = {
            columns,
        }

        return partition;
    }

    export function InitManyFromPartitionColumnDescriptor(columns: ReadonlyArray<IColumnData>, partitionColumnDescriptor: IColumnData_MinimalDescriptor | undefined) {
        if (partitionColumnDescriptor === undefined) {
            // No partition = return all columns as-is in one partition
            return [Init(columns)];
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
        const allPartitionIndices: number[][] = [];

        partitionColumnValueSet.forEach((val) => {
            allPartitionIndices.push(allIndexOf(partitionColumnCookedValues, val));
        });

        // If the partition column also contains a `null` value, also create a
        // partition to cover nulls as well
        if (partitionColumnCookedValues.indexOf(null) > -1) {
            allPartitionIndices.push(allIndexOf(partitionColumnCookedValues, null));
        }

        // For each partition, map out a new set of smaller partitioned columns
        const partitions =
            allPartitionIndices.map((partitionIndices) => {
                const columnsForPartition = columns.map(({ rawColumnValues, label, type }) => {
                    // Extract only the raw column values relevant for this 
                    // partition
                    const partitionedRawColumnValues = indexFilter(rawColumnValues, partitionIndices);

                    // Create a new smaller, partitioned column data object
                    return ColumnData.Init(partitionedRawColumnValues, label, type);
                });

                return Init(columnsForPartition);
            });

        return partitions;
    }

    export function GetNumberOfRecords(partition: Data) {
        const column: IColumnData | undefined = partition.columns[0];

        if (column === undefined) {
            throw new Error("No columns in partition");
        }

        return column.rawColumnValues.length;
    }
}
