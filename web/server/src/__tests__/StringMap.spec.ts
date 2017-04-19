import * as StringMap from "../StringMap";

describe("`init`", () => {
    test("returns a StringMap object (Map)", () => {
        const initObj = StringMap.init();
        expect(initObj).toBeInstanceOf(Map);
    });
});

describe("`add`", () => {
    const stringMap = StringMap.init();

    test("returns a pointer (number)", () => {
        const newString: string = "490teriuhg2487f6y4w8";

        const pointer = StringMap.add(stringMap)(newString);

        expect(typeof pointer).toBe("number");
    });

    test("adds string", () => {
        const testString: string = "qwbk7wttb77jttje3k73";

        const pointer = StringMap.add(stringMap)(testString);

        expect(StringMap.find(stringMap)(testString)).toBe(pointer);
        expect(StringMap.get(stringMap)(pointer)).toBe(testString);
    })

    test("increases map size by 1", () => {
        const newString: string = "asdacsg47iq3bfkabzd9";

        const previousSize = StringMap.size(stringMap);
        StringMap.add(stringMap)(newString);
        const newSize = StringMap.size(stringMap);

        expect(newSize - previousSize).toBe(1);
    });

    test("does not re-add existing strings", () => {
        const testString: string = "32485789347tw38sjdrf";

        // Add string
        const pointer = StringMap.add(stringMap)(testString);
        const size = StringMap.size(stringMap);

        // Re-add same string
        const pointer2 = StringMap.add(stringMap)(testString);
        const size2 = StringMap.size(stringMap);

        expect(pointer2).toBe(pointer);
        expect(size2).toBe(size);
    });
});

describe("`remove`", () => {
    const stringMap = StringMap.init();

    test("removes string", () => {
        const testString: string = "2349764tbhwtfyw53b73";

        const pointer = StringMap.add(stringMap)(testString);

        StringMap.remove(stringMap)(testString);

        expect(() => StringMap.find(stringMap)(testString)).toThrowError();
        expect(() => StringMap.get(stringMap)(pointer)).toThrowError();
    });

    test("decreases map size by 1", () => {
        const testString: string = "43859728vb38trtvbedf";

        StringMap.add(stringMap)(testString);
        const previousSize = StringMap.size(stringMap);

        StringMap.remove(stringMap)(testString);
        const newSize = StringMap.size(stringMap);

        expect(previousSize - newSize).toBe(1);
    });

    test("throws error when re-removing same string", () => {
        const testString: string = "asdacsg47iq3bfkabzd9";

        StringMap.add(stringMap)(testString);
        StringMap.remove(stringMap)(testString);

        expect(() => StringMap.remove(stringMap)(testString)).toThrowError();
    });
});

describe("`removeAt`", () => {
    const stringMap = StringMap.init();

    test("removes string held at pointer location", () => {
        const testString: string = "76bi7b3va2vl6bak4v6i";

        const pointer = StringMap.add(stringMap)(testString);

        StringMap.removeAt(stringMap)(pointer);

        expect(() => StringMap.get(stringMap)(pointer)).toThrowError();
        expect(() => StringMap.find(stringMap)(testString)).toThrowError();
    });

    test("decreases map size by 1", () => {
        const testString: string = "35ln3843n4o89t6vln5t";

        const pointer = StringMap.add(stringMap)(testString);
        const previousSize = StringMap.size(stringMap);

        StringMap.removeAt(stringMap)(pointer);
        const newSize = StringMap.size(stringMap);

        expect(previousSize - newSize).toBe(1);
    });

    test("throws error when removing at invalid pointer location", () => {
        // Definitely invalid pointer
        expect(() => StringMap.removeAt(stringMap)(-1)).toThrowError();

        // Very large number that should not have been allocated a string at this point
        expect(() => StringMap.removeAt(stringMap)(237958394876578236)).toThrowError();
    });

    test("throws error when re-removing same string", () => {
        const testString: string = "asdacsg47iq3bfkabzd9";

        const pointer = StringMap.add(stringMap)(testString);
        StringMap.removeAt(stringMap)(pointer);

        expect(() => StringMap.removeAt(stringMap)(pointer)).toThrowError();
    });

    test("does not re-add existing strings", () => {
        const testString: string = "32485789347tw38sjdrf";

        // Add string
        const pointer = StringMap.add(stringMap)(testString);
        const size = StringMap.size(stringMap);

        // Re-add same string
        const pointer2 = StringMap.add(stringMap)(testString);
        const size2 = StringMap.size(stringMap);

        expect(pointer2).toBe(pointer);
        expect(size2).toBe(size);
    });
});

describe("`size`", () => {
    const stringMap = StringMap.init();

    test("add/remove/re-add of same string should be reflected correctly in map size", () => {
        const testString: string = "oa384a468la463lalv46";

        // Add new string in
        StringMap.add(stringMap)(testString);
        const size1 = StringMap.size(stringMap);

        // Remove string
        StringMap.remove(stringMap)(testString);
        const size2 = StringMap.size(stringMap);

        // Re-add the string back in
        StringMap.add(stringMap)(testString);
        const size3 = StringMap.size(stringMap);

        expect(size2).toBe(size1 - 1);
        expect(size3).toBe(size2 + 1);
    });
});

describe("`get`", () => {
    const stringMap = StringMap.init();

    test("returns expected string from pointer", () => {
        const testString: string = "w3o77357387o5to87o3v";

        const pointer = StringMap.add(stringMap)(testString);

        const gotString = StringMap.get(stringMap)(pointer);

        expect(gotString).toBe(testString);
    });

    test("throws error on invalid pointer", () => {
        // Definitely invalid pointer
        expect(() => StringMap.get(stringMap)(-1)).toThrowError();

        // Very large number that should not have been allocated a string at this point
        expect(() => StringMap.get(stringMap)(32874956478359645)).toThrowError();
    });
});

describe("`find`", () => {
    const stringMap = StringMap.init();

    test("returns expected string pointer", () => {
        const testString: string = "lavwb5law5hk4ay5vbki";

        const pointer = StringMap.add(stringMap)(testString);

        const gotPointer = StringMap.find(stringMap)(testString);

        expect(gotPointer).toBe(pointer);
    });

    test("throws error on string not in map", () => {
        expect(() => StringMap.find(stringMap)("this string should not exist in map")).toThrowError();
    });
});
