


export type Set = ReadonlyArray<Record>;

export interface Record {
    readonly [column: string]: Value,
}

export type Value = number | string | null;






export const getRecordValue =
    (record: Record) =>
        (column: string) => {
            return record[column];
        }

export const getIthRecord =
    (sourceRecordSet: Set) =>
        (i: number) => {
            return sourceRecordSet[i];
        }