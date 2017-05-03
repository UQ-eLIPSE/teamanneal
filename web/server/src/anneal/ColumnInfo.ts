/*
 * ColumnInfo
 * 
 * 
 */
import * as SourceRecord from "./SourceRecord";
import * as SourceRecordSet from "./SourceRecordSet";
import * as StringMap from "./StringMap";
import * as ColumnDesc from "./ColumnDesc";

import * as Util from "../core/Util"; 



export interface ColumnInfo extends Array<ColumnDesc.ColumnDesc> {
}




export const initFrom =
    (stringMap: StringMap.StringMap) =>
        (headers: string[]) =>
            (rawRecords: SourceRecord.RawRecord[]) => {
                // Prepare column infos
                const columnInfo: ColumnInfo =
                    headers
                        .map(StringMap.add(stringMap))
                        .map(
                        (headerNamePointer) => {
                            const columnDesc = ColumnDesc.init();
                            ColumnDesc.setName(columnDesc)(headerNamePointer);
                            return columnDesc;
                        }
                        );

                // Detect column types
                const numberOfColumns = headers.length;
                let numberOfColumnTypesDetected = 0;

                for (let record of rawRecords) {
                    for (let i = 0; i < numberOfColumns; ++i) {
                        const columnDesc = columnInfo[i];

                        // Skip column if type already determined
                        if (ColumnDesc.isTypeSet(columnDesc)) { continue; }

                        // Check type
                        const value = record[i];
                        const type = typeof value;

                        if (type === "string") {
                            // Don't accept determination on a blank string
                            if ((value as string).length === 0) { continue; }

                            ColumnDesc.setTypeString(columnDesc);
                            ++numberOfColumnTypesDetected;
                            continue;
                        }

                        if (type === "number") {
                            ColumnDesc.setTypeNumeric(columnDesc);
                            ++numberOfColumnTypesDetected;
                            continue;
                        }

                        Util.throwErr(new Error(`ColumnInfo: Unexpected raw value "${value}"`));
                    }

                    // Stop once we've detected all column types
                    if (numberOfColumns === numberOfColumnTypesDetected) {
                        break;
                    }
                }

                return columnInfo;
            }

export const populateFrom =
    (columnInfo: ColumnInfo) =>
        (records: SourceRecordSet.SourceRecordSet) => {
            const numberOfColumns = size(columnInfo);

            let columnMin = Util.initArray(Infinity)(numberOfColumns);
            let columnMax = Util.initArray(-Infinity)(numberOfColumns);
            const columnStringDistinctPointers = Util.blankArray(numberOfColumns).map(() => new Set<StringMap.StringPointer>());

            // Go over all records to pick up ranges, distinct values
            records.forEach((record) => {
                record.forEach((value, column) => {
                    const columnDesc = get(columnInfo)(column);

                    if (ColumnDesc.isNumeric(columnDesc)) {
                        // Find min, max
                        if (value < columnMin[column]) {
                            columnMin[column] = value;
                        }

                        if (value > columnMax[column]) {
                            columnMin[column] = value;
                        }

                        return; // Break to next forEach iteration
                    }

                    if (ColumnDesc.isString(columnDesc)) {
                        // Add string pointer to set
                        columnStringDistinctPointers[column].add(value);

                        return; // Break to next forEach iteration
                    }

                    return Util.throwErr(new Error(`ColumnInfo: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
                });
            });

            // Set ranges, distinct info
            columnInfo.forEach((columnDesc, i) => {
                if (ColumnDesc.isNumeric(columnDesc)) {
                    ColumnDesc.setRangeMin(columnDesc)(columnMin[i]);
                    ColumnDesc.setRangeMax(columnDesc)(columnMax[i]);
                    return; // Break to next forEach iteration
                }

                if (ColumnDesc.isString(columnDesc)) {
                    ColumnDesc.setStringDistinct(columnDesc)(columnStringDistinctPointers[i].size);
                    return; // Break to next forEach iteration
                }

                return Util.throwErr(new Error(`ColumnInfo: Unexpected column description type "${ColumnDesc.getType(columnDesc)}"`));
            });


            return columnInfo;
        }

export const get =
    (columnInfo: ColumnInfo) =>
        (i: number) => {
            return columnInfo[i];
        }

export const size = (columnInfo: ColumnInfo) => columnInfo.length;
