import * as Partition from "../Partition";

import * as SourceRecordSet from "../SourceRecordSet";

describe("`init`", () => {
    test("returns a Partition (array; length = specified size)", () => {
        const size: number = 42;
        const initObj = Partition.init(size);
        expect(initObj).toBeInstanceOf(Array);
        expect(initObj).toHaveLength(size);
    });
});

describe("getters/setters", () => {
    const mockSet1: SourceRecordSet.SourceRecordSet = [];
    const mockSet2: SourceRecordSet.SourceRecordSet = [];

    let mockPartition: Partition.Partition;

    // Reinitialise before every test
    beforeEach(() => {
        mockPartition = [
            mockSet1,
            mockSet2,
        ];
    });

    test("`get` fetches correct value", () => {
        expect(Partition.get(mockPartition)(0)).toBe(mockSet1);
        expect(Partition.get(mockPartition)(1)).toBe(mockSet2);
    });

    test("`set` sets correct value", () => {
        const mockSet1a: SourceRecordSet.SourceRecordSet = [];

        // Set position = 0 to set1a
        Partition.set(mockPartition)(0)(mockSet1a);

        expect(Partition.get(mockPartition)(0)).not.toBe(mockSet1);
        expect(Partition.get(mockPartition)(0)).toBe(mockSet1a);
        expect(Partition.get(mockPartition)(1)).toBe(mockSet2);
    });

    test("cannot get value out-of-bounds", () => {
        // Definitely out of bounds
        expect(() => Partition.get(mockPartition)(-1)).toThrowError();
        // Out of bounds (partition only has 2 sets)
        expect(() => Partition.get(mockPartition)(2)).toThrowError();
    });

    test("cannot set value out-of-bounds", () => {
        const set: SourceRecordSet.SourceRecordSet = [];

        // Definitely out of bounds
        expect(() => Partition.set(mockPartition)(-1)(set)).toThrowError();
        // Out of bounds (partition only has 2 sets)
        expect(() => Partition.set(mockPartition)(2)(set)).toThrowError();
    });
});

describe("`shallowCopy`", () => {
    test("performs a shallow copy", () => {
        const mockSet1: SourceRecordSet.SourceRecordSet = [];
        const mockSet2: SourceRecordSet.SourceRecordSet = [];

        const mockPartition: Partition.Partition = [
            mockSet1,
            mockSet2,
        ];

        const shallowCopyPartition = Partition.shallowCopy(mockPartition);

        // Check that the size and elements are equal
        expect(Partition.size(shallowCopyPartition)).toBe(Partition.size(mockPartition));
        expect(Partition.get(shallowCopyPartition)(0)).toBe(Partition.get(mockPartition)(0));
        expect(Partition.get(shallowCopyPartition)(1)).toBe(Partition.get(mockPartition)(1));

        // Shallow copy partition set should not be the same object as original partition
        expect(shallowCopyPartition).not.toBe(mockPartition);
    });
});

describe("`size`", () => {
    test("returns expected size", () => {
        const size: number = 42;
        const partition = Partition.init(size);
        expect(Partition.size(partition)).toBe(size);
    });
});
