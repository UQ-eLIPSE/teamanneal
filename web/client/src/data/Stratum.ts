import * as UUID from "../util/UUID";

import { ListCounterType } from "./ListCounter";

export interface Data {
    _id: string,

    label: string,
    size: Size,
    counter: ListCounterType | string[],
}

export interface Size {
    min: number,
    ideal: number,
    max: number,
}

export namespace Stratum {
    export function Init(
        label: string,
        size: Size,
        counter: ListCounterType | string[] = "decimal",
    ) {
        const data: Data = {
            _id: UUID.generate(),
            label,
            size,
            counter,
        };

        return data;
    }
}
