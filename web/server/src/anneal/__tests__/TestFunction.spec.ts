import * as TestFunction from "../TestFunction";

describe("`eq`", () => {
    test("target = number(1), value = number(1) => true", () => {
        const target = 1;
        const value = 1;
        expect(TestFunction.eq(target, value)).toBe(true);
    });

    test("target = number(1), value = number(2) => false", () => {
        const target = 1;
        const value = 2;
        expect(TestFunction.eq(target, value)).toBe(false);
    });

    test("target = string('abc'), value = number('abc') => true", () => {
        const target = "abc";
        const value = "abc";
        expect(TestFunction.eq(target, value)).toBe(true);
    });

    test("target = string('abc'), value = number(' abc') => false", () => {
        const target = "abc";
        const value = " abc";
        expect(TestFunction.eq(target, value)).toBe(false);
    });

    test("target = number(1), value = null => false", () => {
        const target = 1;
        const value = null;
        expect(TestFunction.eq(target, value)).toBe(false);
    });
});

describe("`neq`", () => {
    test("target = number(1), value = number(1) => false", () => {
        const target = 1;
        const value = 1;
        expect(TestFunction.neq(target, value)).toBe(false);
    });

    test("target = number(1), value = number(2) => true", () => {
        const target = 1;
        const value = 2;
        expect(TestFunction.neq(target, value)).toBe(true);
    });

    test("target = string('abc'), value = number('abc') => false", () => {
        const target = "abc";
        const value = "abc";
        expect(TestFunction.neq(target, value)).toBe(false);
    });

    test("target = string('abc'), value = number(' abc') => true", () => {
        const target = "abc";
        const value = " abc";
        expect(TestFunction.neq(target, value)).toBe(true);
    });

    test("target = number(1), value = null => true", () => {
        const target = 1;
        const value = null;
        expect(TestFunction.neq(target, value)).toBe(true);
    });
});

describe("`lt`", () => {
    test("target = number(1), value = number(1) => false", () => {
        const target = 1;
        const value = 1;
        expect(TestFunction.lt(target, value)).toBe(false);
    });

    test("target = number(1), value = number(2) => false", () => {
        const target = 1;
        const value = 2;
        expect(TestFunction.lt(target, value)).toBe(false);
    });

    test("target = number(1), value = number(-1) => true", () => {
        const target = 1;
        const value = -1;
        expect(TestFunction.lt(target, value)).toBe(true);
    });

    test("target = number(1), value = null => true", () => {
        const target = 1;
        const value = null;
        expect(TestFunction.lt(target, value)).toBe(true);
    });

    test("target = number(-1), value = null => false", () => {
        const target = -1;
        const value = null;
        expect(TestFunction.lt(target, value)).toBe(false);
    });

    test("target = null, value = null => false", () => {
        const target = null;
        const value = null;
        expect(TestFunction.lt(target, value)).toBe(false);
    });

    test("target = null, value = number(1) => false", () => {
        const target = null;
        const value = 1;
        expect(TestFunction.lt(target, value)).toBe(false);
    });

    test("target = null, value = number(-1) => true", () => {
        const target = null;
        const value = -1;
        expect(TestFunction.lt(target, value)).toBe(true);
    });
});

describe("`lte`", () => {
    test("target = number(1), value = number(1) => true", () => {
        const target = 1;
        const value = 1;
        expect(TestFunction.lte(target, value)).toBe(true);
    });

    test("target = number(1), value = number(2) => false", () => {
        const target = 1;
        const value = 2;
        expect(TestFunction.lte(target, value)).toBe(false);
    });

    test("target = number(1), value = number(-1) => true", () => {
        const target = 1;
        const value = -1;
        expect(TestFunction.lte(target, value)).toBe(true);
    });

    test("target = number(1), value = null => true", () => {
        const target = 1;
        const value = null;
        expect(TestFunction.lte(target, value)).toBe(true);
    });

    test("target = number(-1), value = null => false", () => {
        const target = -1;
        const value = null;
        expect(TestFunction.lte(target, value)).toBe(false);
    });

    test("target = null, value = null => true", () => {
        const target = null;
        const value = null;
        expect(TestFunction.lte(target, value)).toBe(true);
    });

    test("target = null, value = number(1) => false", () => {
        const target = null;
        const value = 1;
        expect(TestFunction.lte(target, value)).toBe(false);
    });

    test("target = null, value = number(-1) => true", () => {
        const target = null;
        const value = -1;
        expect(TestFunction.lte(target, value)).toBe(true);
    });
});

describe("`gt`", () => {
    test("target = number(1), value = number(1) => false", () => {
        const target = 1;
        const value = 1;
        expect(TestFunction.gt(target, value)).toBe(false);
    });

    test("target = number(1), value = number(2) => true", () => {
        const target = 1;
        const value = 2;
        expect(TestFunction.gt(target, value)).toBe(true);
    });

    test("target = number(1), value = number(-1) => false", () => {
        const target = 1;
        const value = -1;
        expect(TestFunction.gt(target, value)).toBe(false);
    });

    test("target = number(1), value = null => false", () => {
        const target = 1;
        const value = null;
        expect(TestFunction.gt(target, value)).toBe(false);
    });

    test("target = number(-1), value = null => true", () => {
        const target = -1;
        const value = null;
        expect(TestFunction.gt(target, value)).toBe(true);
    });

    test("target = null, value = null => false", () => {
        const target = null;
        const value = null;
        expect(TestFunction.gt(target, value)).toBe(false);
    });

    test("target = null, value = number(1) => true", () => {
        const target = null;
        const value = 1;
        expect(TestFunction.gt(target, value)).toBe(true);
    });

    test("target = null, value = number(-1) => false", () => {
        const target = null;
        const value = -1;
        expect(TestFunction.gt(target, value)).toBe(false);
    });
});

describe("`gte`", () => {
    test("target = number(1), value = number(1) => true", () => {
        const target = 1;
        const value = 1;
        expect(TestFunction.gte(target, value)).toBe(true);
    });

    test("target = number(1), value = number(2) => true", () => {
        const target = 1;
        const value = 2;
        expect(TestFunction.gte(target, value)).toBe(true);
    });

    test("target = number(1), value = number(-1) => false", () => {
        const target = 1;
        const value = -1;
        expect(TestFunction.gte(target, value)).toBe(false);
    });

    test("target = number(1), value = null => false", () => {
        const target = 1;
        const value = null;
        expect(TestFunction.gte(target, value)).toBe(false);
    });

    test("target = number(-1), value = null => true", () => {
        const target = -1;
        const value = null;
        expect(TestFunction.gte(target, value)).toBe(true);
    });

    test("target = null, value = null => true", () => {
        const target = null;
        const value = null;
        expect(TestFunction.gte(target, value)).toBe(true);
    });

    test("target = null, value = number(1) => true", () => {
        const target = null;
        const value = 1;
        expect(TestFunction.gte(target, value)).toBe(true);
    });

    test("target = null, value = number(-1) => false", () => {
        const target = null;
        const value = -1;
        expect(TestFunction.gte(target, value)).toBe(false);
    });
});
