import * as Record from "./Record";
import * as SourceDataColumn from "./SourceDataColumn";

export interface Desc {
    readonly columns: SourceDataColumn.ColumnDescArray,
    readonly records: Record.RecordSet,
}
