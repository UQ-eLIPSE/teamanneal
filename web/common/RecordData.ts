import * as Record from "./Record";
import * as RecordDataColumn from "./RecordDataColumn";

export interface Desc {
    readonly columns: RecordDataColumn.ColumnDescArray,
    readonly records: Record.RecordSet,
}
