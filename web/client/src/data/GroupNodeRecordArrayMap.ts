import { RecordElement } from "../../../common/Record";

export interface GroupNodeRecordArrayMap {
    [nodeId: string]: RecordElement[],
}

export function initNew() {
    const obj: GroupNodeRecordArrayMap = {};

    return obj;
}
