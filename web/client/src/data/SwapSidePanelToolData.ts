import { GroupNode } from "../data/GroupNode";

import { RecordElement } from "../../../common/Record";

interface _SwapSidePanelToolData {
    cursor: "personA" | "personB",
    personA: { node: GroupNode, id: RecordElement },
    personB: { node: GroupNode, id: RecordElement },
}

export type SwapSidePanelToolData = Partial<_SwapSidePanelToolData>;
