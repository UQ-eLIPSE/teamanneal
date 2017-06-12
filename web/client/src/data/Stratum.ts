import * as Stratum from "../../../common/Stratum";

export interface Stratum extends Stratum.Desc {
    _id: number,
}

export interface Update {
    stratum: Stratum,
}
