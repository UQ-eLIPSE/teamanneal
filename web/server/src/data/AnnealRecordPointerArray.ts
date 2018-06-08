import * as Random from "../data/Random";

export class AnnealRecordPointerArray {
    private readonly memory: Uint32Array;
    public readonly workingSet: Uint32Array;
    public readonly numberOfRecords: number;

    constructor(numberOfRecords: number) {
        // Create a new Uint32Array that is three times the size of the number
        // of records
        //
        // The 3x is because we keep, at any one time, two extra copies as
        // backup states that can be restored later:
        //  * one that reflects current active state (Working Set)
        //  * one for outside branch iterations (Store A)
        //  * one for inside branch iterations (Store B)
        //
        // The reason why we're not doing this through three separate typed
        // arrays is that by having one underlying array buffer, we can take
        // advantage of #copyWithin() to efficiently move data in/out of the
        // stores by moving data between regions of the same contiguous block of
        // memory
        const memory = new Uint32Array(numberOfRecords * 3);

        // Create a view specifically for the working set region
        // This shares the same array buffer as the above `pointerArray`
        const workingSet = new Uint32Array(memory.buffer, 0, numberOfRecords);

        // Store to this object
        this.memory = memory;
        this.workingSet = workingSet;
        this.numberOfRecords = numberOfRecords;
    }

    public shuffle() {
        const workingSet = this.workingSet;
        const numberOfRecords = this.numberOfRecords;

        // Based on http://stackoverflow.com/a/12646864
        let j: number;
        let temp: number;
        for (let i = numberOfRecords - 1; i > 0; i--) {
            j = (Random.randomLong() * (i + 1)) >>> 0;
            temp = workingSet[i];
            workingSet[i] = workingSet[j];
            workingSet[j] = temp;
        }
    }

    public saveToStoreA() {
        // Copy working set region to store A region
        const numberOfRecords = this.numberOfRecords;
        this.memory.copyWithin(numberOfRecords, 0, numberOfRecords);
    }

    public saveToStoreB() {
        // Copy working set region to store B region
        const numberOfRecords = this.numberOfRecords;
        this.memory.copyWithin(numberOfRecords * 2, 0, numberOfRecords);
    }

    public loadFromStoreA() {
        // Copy store A region to working set
        const numberOfRecords = this.numberOfRecords;
        this.memory.copyWithin(0, numberOfRecords, numberOfRecords * 2);
    }

    public loadFromStoreB() {
        // Copy store B region to working set
        const numberOfRecords = this.numberOfRecords;
        this.memory.copyWithin(0, numberOfRecords * 2, numberOfRecords * 3);
    }
}
