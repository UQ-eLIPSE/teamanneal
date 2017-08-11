import * as Record from "./Record";

export type Node = NodeRoot | NodeStratum;

interface NodeBase {
    readonly _id: string,
}

export interface NodeRoot extends NodeBase {
    readonly type: "root",
    readonly children: ReadonlyArray<NodeStratum>,
}

type NodeStratum = NodeStratumWithStratumChildren | NodeStratumWithRecordChildren;

export interface NodeStratumWithStratumChildren extends NodeBase {
    readonly type: "stratum-stratum",
    readonly children: ReadonlyArray<NodeStratum>,
}

export interface NodeStratumWithRecordChildren extends NodeBase {
    readonly type: "stratum-records",

    /** ID values that match the record ID values in the source data */
    readonly recordIds: ReadonlyArray<Record.RecordElement>,
}
