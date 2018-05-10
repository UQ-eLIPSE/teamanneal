import { RecordElement } from "../../../common/Record";

interface _MoveSidePanelToolData {
    cursor: "sourcePerson" | "targetGroup",
    sourcePerson: { node: string, id: RecordElement },
    targetGroup: string,
}

export type MoveSidePanelToolData = Partial<_MoveSidePanelToolData>;
