import * as Stratum from "../../../common/Stratum";
import * as ListCounter from "./ListCounter";

export interface Stratum extends Stratum.Desc {
    _id: number,
    counter: ListCounter.ListCounterType | ReadonlyArray<string>,
}

export interface Update {
    stratum: Stratum,
}

export function isSizeMinGreaterThanIdeal(stratum: Stratum) {
    return stratum.size.min > stratum.size.ideal;
}

export function isSizeIdealGreaterThanMax(stratum: Stratum) {
    return stratum.size.ideal > stratum.size.max;
}

export function isSizeMinLessThanOne(stratum: Stratum) {
    return stratum.size.min < 1;
}

export function isSizeMinNotUint32(stratum: Stratum) {
    const val = stratum.size.min;
    return val >>> 0 !== val;
}

export function isSizeIdealNotUint32(stratum: Stratum) {
    const val = stratum.size.ideal;
    return val >>> 0 !== val;
}

export function isSizeMaxNotUint32(stratum: Stratum) {
    const val = stratum.size.max;
    return val >>> 0 !== val;
}

export function isSizeMinEqualToMax(stratum: Stratum) {
    return stratum.size.min === stratum.size.max;
}
