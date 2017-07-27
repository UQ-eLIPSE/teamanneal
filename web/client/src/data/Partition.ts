import * as SourceData from "../../../common/SourceData";

import * as ColumnInfo from "./ColumnInfo";

export function createPartitions(cookedData: ReadonlyArray<ReadonlyArray<string | number | null>>, partitioningColumnInfo: ColumnInfo.ColumnInfo | undefined): SourceData.PartitionedRecordArray {
    if (partitioningColumnInfo === undefined) {
        // In the event that there was no partition column set, then we just 
        // wrap the records with an array to pretend we have one partition of
        // all records - this has no difference on the outcome of the anneal
        return [cookedData];
    } else {
        const { index, valueSet } = partitioningColumnInfo;

        const tempPartitionSet: any[][] = [];

        // Go through each distinct column value to partition
        (valueSet as Set<number | string>).forEach((val) => {
            const partition: any[] = [];

            // For each (cooked) data row, check if the cell value of the row in
            // the partition column is equal to the distinct value being cycled 
            // through in the column value forEach loop
            cookedData.forEach((row) => {
                if (row[index] === val) {
                    // If so, push into the rows for this partition
                    partition.push(row);
                }
            });

            // Finally we push the partition into the overall partition set
            tempPartitionSet.push(partition);
        });

        return tempPartitionSet;
    }
}
