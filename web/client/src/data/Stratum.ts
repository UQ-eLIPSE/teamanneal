import { StratumSize, initNew as initStratumSize } from "./StratumSize";

import * as UUID from "../util/UUID";

export interface Stratum {
    _id: string,
    label: string,
    size: StratumSize,
}

export function initNew(label: string = "", size: StratumSize = initStratumSize()) {
    const obj: Stratum = {
        _id: UUID.generate(),
        label,
        size,
    };

    return obj;
}

export function equals(a: Stratum, b: Stratum) {
    return a._id === b._id;
}
