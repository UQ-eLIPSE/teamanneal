import * as Stratum from "../../../common/Stratum";
import * as ListCounter from "./ListCounter";

export interface Stratum extends Stratum.Desc {
    _id: number,
    counter: ListCounter.ListCounterType | ReadonlyArray<string>,
}

export interface Update {
    stratum: Stratum,
}
