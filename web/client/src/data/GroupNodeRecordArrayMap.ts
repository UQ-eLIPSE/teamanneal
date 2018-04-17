import { RecordElement } from "../../../common/Record";

export interface GroupNodeRecordArrayMap {
    [nodeId: string]: RecordElement[],
}

export function init() {
    const obj: GroupNodeRecordArrayMap = {};

    return obj;
}
