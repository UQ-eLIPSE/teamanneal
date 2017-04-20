import * as SourceRecord from "../SourceRecord";

import * as StringMap from "../StringMap";
import * as ColumnDesc from "../ColumnDesc";
import * as ColumnInfo from "../ColumnInfo";

describe("`init`", () => {
    test("returns a SourceRecord object (array, length = specified size)", () => {
        const size: number = 42;
        const initObj = SourceRecord.init(size);

        expect(initObj).toBeInstanceOf(Array);
        expect(initObj).toHaveLength(size);
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

    const stringMap = StringMap.init();

    test("normal initialisation", () => {
        const columnInfo: ColumnInfo.ColumnInfo = [
            [0, 0, NaN, NaN, NaN],  // number
            [1, 1, NaN, NaN, NaN],  // string
            [2, 0, NaN, NaN, NaN],  // number
            [3, 1, NaN, NaN, NaN],  // string
            [4, 0, NaN, NaN, NaN],  // number
            [5, 1, NaN, NaN, NaN]   // string
        ];
        const sourceRecord = SourceRecord.initFrom(columnInfo)(stringMap)(rawRecord);

        // Source record should be valid and have same length as raw record
        expect(sourceRecord).toBeInstanceOf(Array);
        expect(sourceRecord).toHaveLength(rawRecord.length);

        // Values should match expected values
        expect(SourceRecord.get(sourceRecord)(0)).toBe(rawRecord[0]);                                       // number stored as is
        expect(SourceRecord.get(sourceRecord)(1)).toBe(StringMap.find(stringMap)(rawRecord[1] as string));  // stored as string pointer
        expect(isNaN(SourceRecord.get(sourceRecord)(2))).toBe(true);                                        // originally NaN value
        expect(SourceRecord.get(sourceRecord)(3)).toBe(StringMap.find(stringMap)(rawRecord[3] as string));  // stored as string pointer
        expect(isNaN(SourceRecord.get(sourceRecord)(4))).toBe(true);                                        // string is converted to NaN in number type
        expect(SourceRecord.get(sourceRecord)(5)).toBe(StringMap.find(stringMap)(rawRecord[5] as string));  // stored as string pointer
    });

    test("silent type conversion where raw values do not match column info object description", () => {
        const columnInfo: ColumnInfo.ColumnInfo = [
            [0, 1, NaN, NaN, NaN],  // string (should be number)
            [1, 1, NaN, NaN, NaN],  // string
            [2, 0, NaN, NaN, NaN],  // number
            [3, 0, NaN, NaN, NaN],  // number (should be string)
            [4, 0, NaN, NaN, NaN],  // number
            [5, 1, NaN, NaN, NaN]   // string
        ];
        const sourceRecord = SourceRecord.initFrom(columnInfo)(stringMap)(rawRecord);

        // Source record should be valid and have same length as raw record
        expect(sourceRecord).toBeInstanceOf(Array);
        expect(sourceRecord).toHaveLength(rawRecord.length);

        // Values should match expected values/type conversions
        expect(SourceRecord.get(sourceRecord)(0)).toBe(StringMap.find(stringMap)(rawRecord[0].toString())); // number converted to string, stored as string pointer
        expect(SourceRecord.get(sourceRecord)(1)).toBe(StringMap.find(stringMap)(rawRecord[1] as string));  // stored as string pointer
        expect(isNaN(SourceRecord.get(sourceRecord)(2))).toBe(true);                                        // originally NaN value
        expect(isNaN(SourceRecord.get(sourceRecord)(3))).toBe(true);                                        // string is converted to NaN in number type
        expect(isNaN(SourceRecord.get(sourceRecord)(4))).toBe(true);                                        // string is converted to NaN in number type
        expect(SourceRecord.get(sourceRecord)(5)).toBe(StringMap.find(stringMap)(rawRecord[5] as string));  // stored as string pointer
    });

    test("invalid column type in column info object should throw error", () => {
        const columnInfo: ColumnInfo.ColumnInfo = [
            [0, 0, NaN, NaN, NaN],  // number
            [1, 1, NaN, NaN, NaN],  // string
            [2, 0, NaN, NaN, NaN],  // number
            [3, 9, NaN, NaN, NaN],  // invalid type (9)
            [4, 0, NaN, NaN, NaN],  // number
            [5, 1, NaN, NaN, NaN]   // string
        ];

        expect(() => SourceRecord.initFrom(columnInfo)(stringMap)(rawRecord)).toThrowError();
    });
});

describe("getter/setter", () => {
    let sourceRecord: SourceRecord.Record;
    const size: number = 42;

    // Reinitialise before every test
    beforeEach(() => {
        sourceRecord = SourceRecord.init(size);
    });

    test("`set`/`get` return same value", () => {
        const columnIndex: number = 2;
        const value: SourceRecord.Value = 23847289;

        const value2 = SourceRecord.set(sourceRecord)(columnIndex)(value);

        const value3 = SourceRecord.get(sourceRecord)(columnIndex);

        expect(value2).toBe(value);
        expect(value3).toBe(value);
    });

    test("`set`/`get` valid in all slots in record", () => {
        for (let i = 0; i < size; ++i) {
            const columnIndex: number = i;
            const value: SourceRecord.Value = 327538475 + i;

            const value2 = SourceRecord.set(sourceRecord)(columnIndex)(value);

            const value3 = SourceRecord.get(sourceRecord)(columnIndex);

            expect(value2).toBe(value);
            expect(value3).toBe(value);
        }
    });

    test("cannot get value out-of-bounds", () => {
        // Definitely out of bounds
        expect(() => SourceRecord.get(sourceRecord)(-1)).toThrowError();
        // Column index = size is out of bounds
        expect(() => SourceRecord.get(sourceRecord)(size)).toThrowError();
    });

    test("cannot set value out-of-bounds", () => {
        const value: SourceRecord.Value = 5345;

        // Definitely out of bounds
        expect(() => SourceRecord.set(sourceRecord)(-1)(value)).toThrowError();
        // Column index = size is out of bounds
        expect(() => SourceRecord.set(sourceRecord)(size)(value)).toThrowError();
    });
});
