import * as Record from "../../../common/Record";

export interface FlattenedTreeItem {
    content: string | Record.Record,
    depth: number,
}
