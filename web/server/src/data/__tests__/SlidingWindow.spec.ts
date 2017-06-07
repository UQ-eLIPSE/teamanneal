import * as SlidingWindow from "../SlidingWindow";

describe("`init`", () => {
    test("returns something", () => {
        const size = 10;
        const initObj = SlidingWindow.init(size);

        expect(initObj).toBeDefined();
    });

    test("returns SlidingWindow with correct size, filled values", () => {
        const size = 10;
        const initObj = SlidingWindow.init(size);

        expect(initObj.data).toHaveLength(size);
        expect(initObj.size).toBe(size);
        expect(initObj.filled).toBe(0);
    });

    test("returns SlidingWindow with filled data store if value provided", () => {
        const size = 10;
        const value = 538967;
        const initObj = SlidingWindow.init(size, value);

        expect(initObj.data).toHaveLength(size);
        expect(initObj.size).toBe(size);
        expect(initObj.filled).toBe(size);

        initObj.data.forEach(dataValue => expect(dataValue).toBe(value));
    });
});

describe("`push`", () => {
    test("pushes elements in", () => {
        const size = 2;
        const sw = SlidingWindow.init<number>(size);

        const element1 = 349875;
        SlidingWindow.push(sw, element1);

        const element2 = 923721;
        SlidingWindow.push(sw, element2);

        expect(sw.data).toContain(element1);
        expect(sw.data).toContain(element2);
    });

    test("pops out old values out", () => {
        const size = 2;
        const sw = SlidingWindow.init<number>(size);

        const element1 = 349875;
        SlidingWindow.push(sw, element1);

        const element2 = 923721;
        SlidingWindow.push(sw, element2);

        const element3 = 589534;
        SlidingWindow.push(sw, element3);

        expect(sw.data).not.toContain(element1);
        expect(sw.data).toContain(element2);
        expect(sw.data).toContain(element3);
    });

    test("increments `filled` property", () => {
        const size = 2;
        const sw = SlidingWindow.init<number>(size);

        expect(sw.filled).toBe(0);

        const element1 = 349875;
        SlidingWindow.push(sw, element1);
        expect(sw.filled).toBe(1);

        const element2 = 923721;
        SlidingWindow.push(sw, element2);
        expect(sw.filled).toBe(2);

        const element3 = 589534;
        SlidingWindow.push(sw, element3);
        // Already full, should no longer increment
        expect(sw.filled).toBe(2);
    });
});

describe("`avg`", () => {
    test("returns 0 for blank SlidingWindow object", () => {
        const size = 10;
        const sw = SlidingWindow.init<number>(size);

        const avg = SlidingWindow.avg(sw);

        expect(avg).toBe(0);
    });

    test("calculates the average on partially filled SlidingWindow", () => {
        const size = 10;
        const sw = SlidingWindow.init<number>(size);

        const element1 = 349875;
        const element2 = 923721;
        const element3 = 589534;

        SlidingWindow.push(sw, element1);
        const avg1 = SlidingWindow.avg(sw);
        SlidingWindow.push(sw, element2);
        const avg2 = SlidingWindow.avg(sw);
        SlidingWindow.push(sw, element3);
        const avg3 = SlidingWindow.avg(sw);

        expect(avg1).toBe(element1);
        expect(avg2).toBe((element1 + element2) / 2);
        expect(avg3).toBe((element1 + element2 + element3) / 3);
    });

    test("calculates the average on fully filled SlidingWindow", () => {
        const size = 2;
        const sw = SlidingWindow.init<number>(size);

        const element1 = 349875;
        const element2 = 923721;
        const element3 = 589534;

        SlidingWindow.push(sw, element1);
        const avg1 = SlidingWindow.avg(sw);
        SlidingWindow.push(sw, element2);
        const avg2 = SlidingWindow.avg(sw);
        SlidingWindow.push(sw, element3);
        const avg3 = SlidingWindow.avg(sw);

        expect(avg1).toBe(element1);
        expect(avg2).toBe((element1 + element2) / 2);
        expect(avg3).toBe((element2 + element3) / 2);
    });
});
