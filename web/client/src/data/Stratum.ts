import * as UUID from "../util/UUID";

import { ListCounterType } from "./ListCounter";

export interface DehydratedData {
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

export class Stratum {
    private _id: string = UUID.generate();

    public label: string;

    public size: Size;
    public counter: ListCounterType | string[];




    public static Hydrate({ _id, label, size, counter, }: DehydratedData) {
        const stratum = new Stratum(label, size, counter);

        // Restore internal ID
        stratum._id = _id;

        return stratum;
    }

    public static Dehydrate({ _id, label, size, counter, }: Stratum) {
        const dehydratedData: DehydratedData = {
            _id,
            label,
            size,
            counter,
        };

        return dehydratedData;
    }





    constructor(label: string, size: Size, counter: ListCounterType | string[] = "decimal") {
        this.label = label;
        this.size = size;
        this.counter = counter;
    }

    /** JSON.stringify() handler */
    toJSON() {
        return Stratum.Dehydrate(this);
    }

    get id() {
        return this._id;
    }
}
