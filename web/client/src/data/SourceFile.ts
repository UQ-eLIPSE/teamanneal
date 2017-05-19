import * as ColumnInfo from "./ColumnInfo";

export interface SourceFile {
    name: string,
    data: (string | number)[][],
    columnInfo: ColumnInfo.ColumnInfo[],
}
