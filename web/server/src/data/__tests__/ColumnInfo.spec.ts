import * as SourceData from "../../../../common/SourceData";
import * as SourceDataColumn from "../../../../common/SourceDataColumn";
import * as Record from "../../../../common/Record";

import * as ColumnInfo from "../ColumnInfo";

describe("`init`", () => {
    test("throws on bad input column object", () => {
        const recordElements: Record.RecordElement[] = [];

        const badInputColumn: any = {
            label: "bad input column",
            type: "badType",
            isId: false,
        }

        expect(() => ColumnInfo.init(recordElements, badInputColumn)).toThrowError();
    });

    test("processes columns of type 'number'", () => {
        const recordElements: Record.RecordElement[] = [
            45.34,
            7485.1,
            6,
            967.25767,
            -48.97,
        ];

        const column: SourceDataColumn.ColumnDesc = {
            label: "number column",
            type: "number",
            isId: false,
        }

        const columnInfo = ColumnInfo.init(recordElements, column);

        // Properties of original column should be present
        expect(columnInfo.label).toBe(column.label);
        expect(columnInfo.type).toBe(column.type);
        expect(columnInfo.isId).toBe(column.isId);

        // Number type column info properties
        if (columnInfo.type !== "number") {
            throw new Error("Assertion for type = number failed");
        }

        const trueMin = Math.min(...recordElements as number[]);
        const trueMax = Math.max(...recordElements as number[]);

        expect(columnInfo.min).toBe(trueMin);
        expect(columnInfo.max).toBe(trueMax);
        expect(columnInfo.range).toBe(trueMax - trueMin);
    });

    test("processes columns of type 'string'", () => {
        const recordElements: Record.RecordElement[] = [
            "6",
            "45.34",
            "6",
            "7485.1",
            "-48.97",
            "6",
            "967.25767",
            "-48.97",
        ];

        const column: SourceDataColumn.ColumnDesc = {
            label: "string column",
            type: "string",
            isId: true,
        }

        const columnInfo = ColumnInfo.init(recordElements, column);

        // Properties of original column should be present
        expect(columnInfo.label).toBe(column.label);
        expect(columnInfo.type).toBe(column.type);
        expect(columnInfo.isId).toBe(column.isId);

        // String type column info properties
        if (columnInfo.type !== "string") {
            throw new Error("Assertion for type = string failed");
        }

        expect(columnInfo.distinct).toBe(5);
    });

    test("ignores non-numbers when processing columns of type 'number'", () => {
        const recordElements: Record.RecordElement[] = [
            45.34,
            7485.1,
            6,
            967.25767,
            -48.97,
        ];

        // Calculate true min, max now
        const trueMin = Math.min(...recordElements as number[]);
        const trueMax = Math.max(...recordElements as number[]);

        // Place invalid elements are start of record elements array
        recordElements.unshift(null, undefined, "string", { object: true } as any);



        const column: SourceDataColumn.ColumnDesc = {
            label: "number column",
            type: "number",
            isId: false,
        }

        const columnInfo = ColumnInfo.init(recordElements, column);

        // Properties of original column should be present
        expect(columnInfo.label).toBe(column.label);
        expect(columnInfo.type).toBe(column.type);
        expect(columnInfo.isId).toBe(column.isId);

        // Number type column info properties
        if (columnInfo.type !== "number") {
            throw new Error("Assertion for type = number failed");
        }

        expect(columnInfo.min).toBe(trueMin);
        expect(columnInfo.max).toBe(trueMax);
        expect(columnInfo.range).toBe(trueMax - trueMin);
    });
});

describe("`initFromColumnIndex`", () => {
    test("maps correct index values for initialisation", () => {
        const records: Record.RecordSet = [
            ["50", 51, 52, "53", 54, "55", 56, 57, "58", 59],
            ["90", 91, 92, "93", 94, "95", 96, 97, "98", 99],
            ["70", 71, 72, "73", 74, "75", 76, 77, "78", 79],
            ["60", 61, 62, "63", 64, "65", 66, 67, "68", 69],
            ["80", 81, 82, "83", 84, "85", 86, 87, "88", 89],
            ["10", 11, 12, "13", 14, "15", 16, 17, "18", 19],
            ["0", 1, 2, "3", 4, "5", 6, 7, "8", 9],
            ["40", 41, 42, "43", 44, "45", 46, 47, "48", 49],
            ["20", 21, 22, "23", 24, "25", 26, 27, "28", 29],
            ["30", 31, 32, "33", 34, "35", 36, 37, "38", 39],
        ];

        const index = 4;    // The 5th column

        const column: SourceDataColumn.ColumnDesc = {
            label: "the 5th column",
            type: "number",
            isId: false,
        }

        const columnInfo = ColumnInfo.initFromColumnIndex(records, index, column);

        // Properties of original column should be present
        expect(columnInfo.label).toBe(column.label);
        expect(columnInfo.type).toBe(column.type);
        expect(columnInfo.isId).toBe(column.isId);

        // Number type column info properties
        if (columnInfo.type !== "number") {
            throw new Error("Assertion for type = number failed");
        }

        // Min and max of the 5th column
        const trueMin = 4;
        const trueMax = 94;

        expect(columnInfo.min).toBe(trueMin);
        expect(columnInfo.max).toBe(trueMax);
        expect(columnInfo.range).toBe(trueMax - trueMin);
    });
});
