import { GroupNodeIntermediateStratum } from "./GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "./GroupNodeLeafStratum";

export interface GroupNodeIntermediateStratum {
    _id: string,
    type: "intermediate-stratum",
    children: (GroupNodeIntermediateStratum | GroupNodeLeafStratum)[],
}
