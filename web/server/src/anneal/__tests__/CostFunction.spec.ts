import * as CostFunction from "../CostFunction";

describe("`eq`", () => {
    test("target = number(1), value = number(1) => 0", () => {
        const target = 1;
        const value = 1;
        expect(CostFunction.eq(target, value)).toBe(0);
    });

    test("target = number(1), value = number(2) => 1", () => {
        const target = 1;
        const value = 2;
        expect(CostFunction.eq(target, value)).toBe(1);
    });

    test("target = string('abc'), value = number('abc') => 0", () => {
        const target = "abc";
        const value = "abc";
        expect(CostFunction.eq(target, value)).toBe(0);
    });

    test("target = string('abc'), value = number(' abc') => 1", () => {
        const target = "abc";
        const value = " abc";
        expect(CostFunction.eq(target, value)).toBe(1);
    });

    test("target = number(1), value = null => 1", () => {
        const target = 1;
        const value = null;
        expect(CostFunction.eq(target, value)).toBe(1);
    });
});

describe("`neq`", () => {
    test("target = number(1), value = number(1) => 1", () => {
        const target = 1;
        const value = 1;
        expect(CostFunction.neq(target, value)).toBe(1);
    });

    test("target = number(1), value = number(2) => 0", () => {
        const target = 1;
        const value = 2;
        expect(CostFunction.neq(target, value)).toBe(0);
    });

    test("target = string('abc'), value = number('abc') => 1", () => {
        const target = "abc";
        const value = "abc";
        expect(CostFunction.neq(target, value)).toBe(1);
    });

    test("target = string('abc'), value = number(' abc') => 0", () => {
        const target = "abc";
        const value = " abc";
        expect(CostFunction.neq(target, value)).toBe(0);
    });

    test("target = number(1), value = null => 0", () => {
        const target = 1;
        const value = null;
        expect(CostFunction.neq(target, value)).toBe(0);
    });
});

describe("`lt`", () => {
    test("target = number(1), value = number(1) => 1", () => {
        const target = 1;
        const value = 1;
        expect(CostFunction.lt(target, value)).toBe(1);
    });

    test("target = number(1), value = number(2) => 1", () => {
        const target = 1;
        const value = 2;
        expect(CostFunction.lt(target, value)).toBe(1);
    });

    test("target = number(1), value = number(-1) => 0", () => {
        const target = 1;
        const value = -1;
        expect(CostFunction.lt(target, value)).toBe(0);
    });

    test("target = number(1), value = null => 0", () => {
        const target = 1;
        const value = null;
        expect(CostFunction.lt(target, value)).toBe(0);
    });

    test("target = number(-1), value = null => 1", () => {
        const target = -1;
        const value = null;
        expect(CostFunction.lt(target, value)).toBe(1);
    });

    test("target = null, value = null => 1", () => {
        const target = null;
        const value = null;
        expect(CostFunction.lt(target, value)).toBe(1);
    });

    test("target = null, value = number(1) => 1", () => {
        const target = null;
        const value = 1;
        expect(CostFunction.lt(target, value)).toBe(1);
    });

    test("target = null, value = number(-1) => 0", () => {
        const target = null;
        const value = -1;
        expect(CostFunction.lt(target, value)).toBe(0);
    });
});

describe("`lte`", () => {
    test("target = number(1), value = number(1) => 0", () => {
        const target = 1;
        const value = 1;
        expect(CostFunction.lte(target, value)).toBe(0);
    });

    test("target = number(1), value = number(2) => 1", () => {
        const target = 1;
        const value = 2;
        expect(CostFunction.lte(target, value)).toBe(1);
    });

    test("target = number(1), value = number(-1) => 0", () => {
        const target = 1;
        const value = -1;
        expect(CostFunction.lte(target, value)).toBe(0);
    });

    test("target = number(1), value = null => 0", () => {
        const target = 1;
        const value = null;
        expect(CostFunction.lte(target, value)).toBe(0);
    });

    test("target = number(-1), value = null => 1", () => {
        const target = -1;
        const value = null;
        expect(CostFunction.lte(target, value)).toBe(1);
    });

    test("target = null, value = null => 0", () => {
        const target = null;
        const value = null;
        expect(CostFunction.lte(target, value)).toBe(0);
    });

    test("target = null, value = number(1) => 1", () => {
        const target = null;
        const value = 1;
        expect(CostFunction.lte(target, value)).toBe(1);
    });

    test("target = null, value = number(-1) => 0", () => {
        const target = null;
        const value = -1;
        expect(CostFunction.lte(target, value)).toBe(0);
    });
});

describe("`gt`", () => {
    test("target = number(1), value = number(1) => 1", () => {
        const target = 1;
        const value = 1;
        expect(CostFunction.gt(target, value)).toBe(1);
    });

    test("target = number(1), value = number(2) => 0", () => {
        const target = 1;
        const value = 2;
        expect(CostFunction.gt(target, value)).toBe(0);
    });

    test("target = number(1), value = number(-1) => 1", () => {
        const target = 1;
        const value = -1;
        expect(CostFunction.gt(target, value)).toBe(1);
    });

    test("target = number(1), value = null => 1", () => {
        const target = 1;
        const value = null;
        expect(CostFunction.gt(target, value)).toBe(1);
    });

    test("target = number(-1), value = null => 0", () => {
        const target = -1;
        const value = null;
        expect(CostFunction.gt(target, value)).toBe(0);
    });

    test("target = null, value = null => 1", () => {
        const target = null;
        const value = null;
        expect(CostFunction.gt(target, value)).toBe(1);
    });

    test("target = null, value = number(1) => 0", () => {
        const target = null;
        const value = 1;
        expect(CostFunction.gt(target, value)).toBe(0);
    });

    test("target = null, value = number(-1) => 1", () => {
        const target = null;
        const value = -1;
        expect(CostFunction.gt(target, value)).toBe(1);
    });
});

describe("`gte`", () => {
    test("target = number(1), value = number(1) => 0", () => {
        const target = 1;
        const value = 1;
        expect(CostFunction.gte(target, value)).toBe(0);
    });

    test("target = number(1), value = number(2) => 0", () => {
        const target = 1;
        const value = 2;
        expect(CostFunction.gte(target, value)).toBe(0);
    });

    test("target = number(1), value = number(-1) => 1", () => {
        const target = 1;
        const value = -1;
        expect(CostFunction.gte(target, value)).toBe(1);
    });

    test("target = number(1), value = null => 1", () => {
        const target = 1;
        const value = null;
        expect(CostFunction.gte(target, value)).toBe(1);
    });

    test("target = number(-1), value = null => 0", () => {
        const target = -1;
        const value = null;
        expect(CostFunction.gte(target, value)).toBe(0);
    });

    test("target = null, value = null => 0", () => {
        const target = null;
        const value = null;
        expect(CostFunction.gte(target, value)).toBe(0);
    });

    test("target = null, value = number(1) => 0", () => {
        const target = null;
        const value = 1;
        expect(CostFunction.gte(target, value)).toBe(0);
    });

    test("target = null, value = number(-1) => 1", () => {
        const target = null;
        const value = -1;
        expect(CostFunction.gte(target, value)).toBe(1);
    });
});
