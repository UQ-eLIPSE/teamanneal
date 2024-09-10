import { GroupNodeIntermediateStratum as GroupNodeIntermediateStratumType } from "./GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "./GroupNodeLeafStratum";

export interface GroupNodeIntermediateStratum {
    _id: string,
    type: "intermediate-stratum",
    children: (GroupNodeIntermediateStratumType | GroupNodeLeafStratum)[],
}
