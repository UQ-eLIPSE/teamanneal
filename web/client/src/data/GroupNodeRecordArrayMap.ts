import { RecordElement } from "../../../common/Record";

export interface GroupNodeRecordArrayMap {
    [nodeId: string]: RecordElement[],
}

export function initNew() {
    return {} as GroupNodeRecordArrayMap;
}
