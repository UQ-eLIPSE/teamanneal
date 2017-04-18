import * as ColumnDesc from "../ColumnDesc";
import * as StringMap from "../StringMap";

describe("`init`", () => {
    test("returns a ColumnDesc object (array; length = __size)", () => {
        const initObj = ColumnDesc.init();
        expect(initObj).toBeInstanceOf(Array);
        expect(initObj.length).toBe(ColumnDesc.__size);
    });
});

describe("getters/setters", () => {
    let columnDesc: ColumnDesc.ColumnDesc;

    // Reinitialise before every test
    beforeEach(() => {
        columnDesc = ColumnDesc.init();
    });

    test("`setName`/`getName`", () => {
        const stringPointer: StringMap.StringPointer = 1;

        ColumnDesc.setName(columnDesc)(stringPointer);
        expect(ColumnDesc.getName(columnDesc)).toBe(stringPointer);
    });

    test("`setTypeNumeric`/`isNumeric`", () => {
        ColumnDesc.setTypeNumeric(columnDesc);
        expect(ColumnDesc.isNumeric(columnDesc)).toBe(true);
    });

    test("`setTypeString`/`isString`", () => {
        ColumnDesc.setTypeString(columnDesc);
        expect(ColumnDesc.isString(columnDesc)).toBe(true);
    });

    test("`setRangeMin`/`getRangeMin`", () => {
        const rangeVal: number = 2;

        ColumnDesc.setRangeMin(columnDesc)(rangeVal);
        expect(ColumnDesc.getRangeMin(columnDesc)).toBe(rangeVal);
    });

    test("`setRangeMax`/`getRangeMax`", () => {
        const rangeVal: number = 3;

        ColumnDesc.setRangeMax(columnDesc)(rangeVal);
        expect(ColumnDesc.getRangeMax(columnDesc)).toBe(rangeVal);
    });

    test("`setRange*`/`getRange`", () => {
        const rangeMinVal: number = -34;
        const rangeMaxVal: number = 455;
        
        ColumnDesc.setRangeMin(columnDesc)(rangeMinVal);
        ColumnDesc.setRangeMax(columnDesc)(rangeMaxVal);

        expect(ColumnDesc.getRange(columnDesc)).toBe(rangeMaxVal - rangeMinVal);
    });

    test("`setStringDistinct`/`getStringDistinct`", () => {
        const strDistinctVal: number = 4;

        ColumnDesc.setStringDistinct(columnDesc)(strDistinctVal);
        expect(ColumnDesc.getStringDistinct(columnDesc)).toBe(strDistinctVal);
    });

    test("`isTypeSet` = 'false' for new objects", () => {
        // Type not set at start
        expect(ColumnDesc.isTypeSet(columnDesc)).toBe(false);
    });

    test("`isTypeSet` = 'true' after type set", () => {
        // Type not set at start
        // Set a type
        ColumnDesc.setTypeNumeric(columnDesc);

        // Type should now be set
        expect(ColumnDesc.isTypeSet(columnDesc)).toBe(true);
    });
});
