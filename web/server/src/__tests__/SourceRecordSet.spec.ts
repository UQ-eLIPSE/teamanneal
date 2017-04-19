import * as SourceRecordSet from "../SourceRecordSet";

import * as SourceRecord from "../SourceRecord";

import * as StringMap from "../StringMap";
import * as ColumnInfo from "../ColumnInfo";

describe("`init`", () => {
    test("returns a SourceRecordSet (array; length = 0)", () => {
        const initObj = SourceRecordSet.init();
        expect(initObj).toBeInstanceOf(Array);
        expect(initObj).toHaveLength(0);
    });
});

describe("`initFrom`", () => {
    const rawRecord: SourceRecord.RawRecord = [
        897,
        "this is a raw record",
        NaN,
        "strings are interspersed!",
        "",
        "and numbers too",
    ];

    const columnInfo: ColumnInfo.ColumnInfo = [
        [0, 0, NaN, NaN, NaN],  // number
        [1, 1, NaN, NaN, NaN],  // string
        [2, 0, NaN, NaN, NaN],  // number
        [3, 1, NaN, NaN, NaN],  // string
        [4, 0, NaN, NaN, NaN],  // number
        [5, 1, NaN, NaN, NaN]   // string
    ];

    const stringMap = StringMap.init();

    test("normal initialisation", () => {
        const rawRecords = [rawRecord];
        const set = SourceRecordSet.initFrom(columnInfo)(stringMap)(rawRecords);

        expect(set).toBeInstanceOf(Array);
        expect(SourceRecordSet.size(set)).toBe(rawRecords.length);
    });
});

describe("getters/setters", () => {
    let sourceRecordSet: SourceRecordSet.SourceRecordSet;

    // Reinitialise before every test
    beforeEach(() => {
        sourceRecordSet = SourceRecordSet.init();
    });

    test("`get` fetches correct value", () => {
        const record1: SourceRecord.Record = []; // Mock record
        const record2: SourceRecord.Record = []; // Mock record

        SourceRecordSet.push(sourceRecordSet)(record1);
        SourceRecordSet.push(sourceRecordSet)(record2);

        expect(SourceRecordSet.get(sourceRecordSet)(0)).toBe(record1);
        expect(SourceRecordSet.get(sourceRecordSet)(1)).toBe(record2);
    });

    test("`set` sets correct value", () => {
        const record1: SourceRecord.Record = []; // Mock record
        const record1a: SourceRecord.Record = [];// Mock record
        const record2: SourceRecord.Record = []; // Mock record

        SourceRecordSet.push(sourceRecordSet)(record1);
        SourceRecordSet.push(sourceRecordSet)(record2);

        // Set position = 0 to record1a
        SourceRecordSet.set(sourceRecordSet)(0)(record1a);

        expect(SourceRecordSet.get(sourceRecordSet)(0)).not.toBe(record1);
        expect(SourceRecordSet.get(sourceRecordSet)(0)).toBe(record1a);
        expect(SourceRecordSet.get(sourceRecordSet)(1)).toBe(record2);
    });

    test("cannot get value out-of-bounds", () => {
        // Set is blank at this stage

        // Definitely out of bounds
        expect(() => SourceRecordSet.get(sourceRecordSet)(-1)).toThrowError();
        // Accessing something in a blank set is out of bounds
        expect(() => SourceRecordSet.get(sourceRecordSet)(0)).toThrowError();
    });

    test("cannot set value out-of-bounds", () => {
        const record: SourceRecord.Record = []; // Mock record

        // Set is blank at this stage

        // Definitely out of bounds
        expect(() => SourceRecordSet.set(sourceRecordSet)(-1)(record)).toThrowError();
        // Accessing something in a blank set is out of bounds
        expect(() => SourceRecordSet.set(sourceRecordSet)(0)(record)).toThrowError();
    });





    test("`set`/`get`", () => {
        const record1: SourceRecord.Record = []; // Mock record
        const record2: SourceRecord.Record = []; // Mock record

        SourceRecordSet.push(sourceRecordSet)(record1);
        SourceRecordSet.push(sourceRecordSet)(record2);

    });
});

describe("`push`", () => {
    const sourceRecordSet = SourceRecordSet.init();

    test("returns the set upon push", () => {
        const record: SourceRecord.Record = []; // Mock record

        const set = SourceRecordSet.push(sourceRecordSet)(record);

        expect(set).toBe(sourceRecordSet);
    });

    test("pushing a record increases size by 1", () => {
        const record: SourceRecord.Record = []; // Mock record

        const previousSize = SourceRecordSet.size(sourceRecordSet);
        SourceRecordSet.push(sourceRecordSet)(record);
        const newSize = SourceRecordSet.size(sourceRecordSet);

        expect(newSize - previousSize).toBe(1);
    });

    test("pushes are idempotent", () => {
        const record: SourceRecord.Record = []; // Mock record

        // Push once
        SourceRecordSet.push(sourceRecordSet)(record);
        const size1 = SourceRecordSet.size(sourceRecordSet);

        // Push again
        SourceRecordSet.push(sourceRecordSet)(record);
        const size2 = SourceRecordSet.size(sourceRecordSet);

        expect(size2 - size1).toBe(0);
    });
});

describe("`shallowCopy`", () => {
    const sourceRecordSet = SourceRecordSet.init();

    test("performs a shallow copy", () => {
        const record1: SourceRecord.Record = []; // Mock record
        const record2: SourceRecord.Record = []; // Mock record

        SourceRecordSet.push(sourceRecordSet)(record1);
        SourceRecordSet.push(sourceRecordSet)(record2);

        const shallowCopySet = SourceRecordSet.shallowCopy(sourceRecordSet);

        // Check that the size and elements are equal
        expect(SourceRecordSet.size(shallowCopySet)).toBe(SourceRecordSet.size(sourceRecordSet));
        expect(SourceRecordSet.get(shallowCopySet)(0)).toBe(SourceRecordSet.get(sourceRecordSet)(0));
        expect(SourceRecordSet.get(shallowCopySet)(1)).toBe(SourceRecordSet.get(sourceRecordSet)(1));

        // Shallow copy set should not be the same object as original set
        expect(shallowCopySet).not.toBe(sourceRecordSet);
    });
});

describe("`size`", () => {
    const sourceRecordSet = SourceRecordSet.init();

    test("initial size = 0", () => {
        expect(SourceRecordSet.size(sourceRecordSet)).toBe(0);
    });
});
