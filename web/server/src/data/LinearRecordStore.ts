import * as Record from "../../../common/Record";

export class LinearRecordStore {
    /** Mutable linear store which contains pointers to records */
    private recordPointerStore: Uint32Array;

    /** Immutable array of actual records */
    private records: Record.RecordSet;

    constructor(records: Record.RecordSet) {
        this.records = records;

        // Set up pointer store with pointer values
        const recordPointerStore = new Uint32Array(records.length);

        // Pointers are just the record index
        for (let i = 0; i < records.length; ++i) {
            recordPointerStore[i] = i;
        }

        this.recordPointerStore = recordPointerStore;
    }

    /**
     * Swaps records held at given positions (not pointers!)
     * 
     * @param indexA Position of record A
     * @param indexB Position of record B
     */
    public swap(indexA: number, indexB: number) {
        const pointerA = this.recordPointerStore[indexA];
        const pointerB = this.recordPointerStore[indexB];

        // Swap pointers
        this.recordPointerStore[indexA] = pointerB;
        this.recordPointerStore[indexB] = pointerA;
    }

    public move(to: number, from: number) {
        throw new Error("Not implemented");
    }

    public readPointers(start: number, size: number) {
        return this.recordPointerStore.slice(start, start + size);
    }

    public read(start: number, size: number) {
        const records = this.records;
        const pointers = this.readPointers(start, size);

        const outputRecords: Record.Record[] = [];

        for (let i = 0; i < pointers.length; ++i) {
            const pointer = pointers[i];
            outputRecords.push(records[pointer]);
        }

        return outputRecords;
    }
}
