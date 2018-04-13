import { GroupNodeRoot } from "./GroupNodeRoot";
import { GroupNodeIntermediateStratum } from "./GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "./GroupNodeLeafStratum";

export type GroupNode =
    GroupNodeRoot |
    GroupNodeIntermediateStratum |
    GroupNodeLeafStratum;
