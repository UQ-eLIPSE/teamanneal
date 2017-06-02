import * as StringMap from "../StringMap";

describe("`init`", () => {
    test("returns a StringMap object", () => {
        const initObj = new StringMap.StringMap();
        expect(initObj).toBeInstanceOf(StringMap.StringMap);
    });
});

describe("`add`", () => {
    const stringMap = new StringMap.StringMap();

    test("returns a pointer (number)", () => {
        const newString: string = "490teriuhg2487f6y4w8";

        const pointer = stringMap.add(newString);

        expect(typeof pointer).toBe("number");
    });

    test("adds string", () => {
        const testString: string = "qwbk7wttb77jttje3k73";

        const pointer = stringMap.add(testString);

        expect(stringMap.find(testString)).toBe(pointer);
        expect(stringMap.get(pointer)).toBe(testString);
    })

    test("increases map size by 1", () => {
        const newString: string = "asdacsg47iq3bfkabzd9";

        const previousSize = stringMap.size;
        stringMap.add(newString);
        const newSize = stringMap.size;

        expect(newSize - previousSize).toBe(1);
    });

    test("does not re-add existing strings", () => {
        const testString: string = "32485789347tw38sjdrf";

        // Add string
        const pointer = stringMap.add(testString);
        const size = stringMap.size;

        // Re-add same string
        const pointer2 = stringMap.add(testString);
        const size2 = stringMap.size;

        expect(pointer2).toBe(pointer);
        expect(size2).toBe(size);
    });
});

describe("`remove`", () => {
    const stringMap = new StringMap.StringMap();

    test("removes string", () => {
        const testString: string = "2349764tbhwtfyw53b73";

        const pointer = stringMap.add(testString);

        stringMap.remove(testString);

        expect(() => stringMap.find(testString)).toThrowError();
        expect(() => stringMap.get(pointer)).toThrowError();
    });

    test("decreases map size by 1", () => {
        const testString: string = "43859728vb38trtvbedf";

        stringMap.add(testString);
        const previousSize = stringMap.size;

        stringMap.remove(testString);
        const newSize = stringMap.size;

        expect(previousSize - newSize).toBe(1);
    });

    test("throws error when re-removing same string", () => {
        const testString: string = "asdacsg47iq3bfkabzd9";

        stringMap.add(testString);
        stringMap.remove(testString);

        expect(() => stringMap.remove(testString)).toThrowError();
    });
});

describe("`removeAt`", () => {
    const stringMap = new StringMap.StringMap();

    test("removes string held at pointer location", () => {
        const testString: string = "76bi7b3va2vl6bak4v6i";

        const pointer = stringMap.add(testString);

        stringMap.removeAt(pointer);

        expect(() => stringMap.get(pointer)).toThrowError();
        expect(() => stringMap.find(testString)).toThrowError();
    });

    test("decreases map size by 1", () => {
        const testString: string = "35ln3843n4o89t6vln5t";

        const pointer = stringMap.add(testString);
        const previousSize = stringMap.size;

        stringMap.removeAt(pointer);
        const newSize = stringMap.size;

        expect(previousSize - newSize).toBe(1);
    });

    test("throws error when removing at invalid pointer location", () => {
        // Definitely invalid pointer
        expect(() => stringMap.removeAt(-1)).toThrowError();

        // Very large number that should not have been allocated a string at this point
        expect(() => stringMap.removeAt(237958394876578236)).toThrowError();
    });

    test("throws error when re-removing same string", () => {
        const testString: string = "asdacsg47iq3bfkabzd9";

        const pointer = stringMap.add(testString);
        stringMap.removeAt(pointer);

        expect(() => stringMap.removeAt(pointer)).toThrowError();
    });

    test("does not re-add existing strings", () => {
        const testString: string = "32485789347tw38sjdrf";

        // Add string
        const pointer = stringMap.add(testString);
        const size = stringMap.size;

        // Re-add same string
        const pointer2 = stringMap.add(testString);
        const size2 = stringMap.size;

        expect(pointer2).toBe(pointer);
        expect(size2).toBe(size);
    });
});

describe("`size`", () => {
    const stringMap = new StringMap.StringMap();

    test("add/remove/re-add of same string should be reflected correctly in map size", () => {
        const testString: string = "oa384a468la463lalv46";

        // Add new string in
        stringMap.add(testString);
        const size1 = stringMap.size;

        // Remove string
        stringMap.remove(testString);
        const size2 = stringMap.size;

        // Re-add the string back in
        stringMap.add(testString);
        const size3 = stringMap.size;

        expect(size2).toBe(size1 - 1);
        expect(size3).toBe(size2 + 1);
    });
});

describe("`get`", () => {
    const stringMap = new StringMap.StringMap();

    test("returns expected string from pointer", () => {
        const testString: string = "w3o77357387o5to87o3v";

        const pointer = stringMap.add(testString);

        const gotString = stringMap.get(pointer);

        expect(gotString).toBe(testString);
    });

    test("throws error on invalid pointer", () => {
        // Definitely invalid pointer
        expect(() => stringMap.get(-1)).toThrowError();

        // Very large number that should not have been allocated a string at this point
        expect(() => stringMap.get(32874956478359645)).toThrowError();
    });
});

describe("`find`", () => {
    const stringMap = new StringMap.StringMap();

    test("returns expected string pointer", () => {
        const testString: string = "lavwb5law5hk4ay5vbki";

        const pointer = stringMap.add(testString);

        const gotPointer = stringMap.find(testString);

        expect(gotPointer).toBe(pointer);
    });

    test("throws error on string not in map", () => {
        expect(() => stringMap.find("this string should not exist in map")).toThrowError();
    });
});
