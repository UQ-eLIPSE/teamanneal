/** Element value in a record */
export type RecordElement = number | string | null;
/** A record is an array of values (elements) */
export type Record = ReadonlyArray<RecordElement>;
/** A set of records */
export type RecordSet = ReadonlyArray<Record>;
