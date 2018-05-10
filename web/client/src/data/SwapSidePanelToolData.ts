import { RecordElement } from "../../../common/Record";

interface _SwapSidePanelToolData {
    cursor: "personA" | "personB",
    personA: { node: string, id: RecordElement },
    personB: { node: string, id: RecordElement },
}

export type SwapSidePanelToolData = Partial<_SwapSidePanelToolData>;
