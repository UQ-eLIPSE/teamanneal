import { GroupNodeIntermediateStratum } from "./GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "./GroupNodeLeafStratum";

export interface GroupNodeRoot {
    _id: string,
    type: "root",
    children: GroupNodeIntermediateStratum | GroupNodeLeafStratum,
}
