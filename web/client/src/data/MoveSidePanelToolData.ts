import { GroupNode } from "../data/GroupNode";

import { RecordElement } from "../../../common/Record";

interface _MoveSidePanelToolData {
    cursor: "sourcePerson" | "targetGroup",
    sourcePerson: { node: GroupNode, id: RecordElement },
    targetGroup: GroupNode,
}

export type MoveSidePanelToolData = Partial<_MoveSidePanelToolData>;
