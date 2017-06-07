export type ColumnDescArray = ReadonlyArray<ColumnDesc>;
export type ColumnType = "number" | "string";

export interface ColumnDesc {
    /** Column heading text */
    readonly label: string,
    /** Column value type */
    readonly type: ColumnType,
    /**
     * Identifies if column contains unique identifiers;
     * only one "true" value permissible in a source data set
     */
    readonly isId: boolean,
}
