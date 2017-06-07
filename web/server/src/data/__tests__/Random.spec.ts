import * as Util from "../../core/Util";

import * as Random from "../Random";

describe("`init`", () => {
    test("returns a generator object", () => {
        const generator = Random.init();

        expect(generator).toBeDefined();
        expect(generator).toBeInstanceOf(Object);
    });

    test("produces generators with different seeds", () => {
        const generator1 = Random.init();
        const generator2 = Random.init();

        const stateVector1 = Random.getState(generator1).vector;
        const stateVector2 = Random.getState(generator2).vector;

        // We should not be getting a full array match
        expect(stateVector1).not.toEqual(stateVector2);
    });
});

describe("`setGlobalSeed`", () => {
    test("changes global PRNG state vector", () => {
        // We have to Array#slice() the state vectors as the array **object**
        // is being returned and will be mutated as part of the global generator
        Random.setGlobalSeed(0);
        const stateVector1 = Random.getGlobalState().vector;

        Random.setGlobalSeed(1);
        const stateVector2 = Random.getGlobalState().vector;

        // We should not be getting a full array match
        expect(stateVector1).not.toEqual(stateVector2);
    });
});

describe("`setGlobalRandomSeed`", () => {
    test("changes global PRNG state vector", () => {
        // We have to Array#slice() the state vectors as the array **object**
        // is being returned and will be mutated as part of the global generator
        Random.setGlobalRandomSeed();
        const stateVector1 = Random.getGlobalState().vector;

        Random.setGlobalRandomSeed();
        const stateVector2 = Random.getGlobalState().vector;

        // We should not be getting a full array match
        expect(stateVector1).not.toEqual(stateVector2);
    });
});

describe("`get/setGlobalState`", () => {
    test("permits replayable random()", () => {
        // Set to random seed
        Random.setGlobalRandomSeed();

        // State captured and random numbers generated
        const state = Random.getGlobalState();
        const randNumArr1 = Util.initArrayFunc(_ => Random.random())(100);

        // Reset state and hopefully get same random numbers
        Random.setGlobalState(state);
        const randNumArr2 = Util.initArrayFunc(_ => Random.random())(100);

        // We should be getting a full array match
        expect(randNumArr1).toEqual(randNumArr2);
    });

    test("permits replayable randomLong()", () => {
        // Set to random seed
        Random.setGlobalRandomSeed();

        // State captured and random numbers generated
        const state = Random.getGlobalState();
        const randNumArr1 = Util.initArrayFunc(_ => Random.randomLong())(100);

        // Reset state and hopefully get same random numbers
        Random.setGlobalState(state);
        const randNumArr2 = Util.initArrayFunc(_ => Random.randomLong())(100);

        // We should be getting a full array match
        expect(randNumArr1).toEqual(randNumArr2);
    });

    test("permits replayable randomUint32()", () => {
        // Set to random seed
        Random.setGlobalRandomSeed();

        // State captured and random numbers generated
        const state = Random.getGlobalState();
        const randNumArr1 = Util.initArrayFunc(_ => Random.randomUint32())(100);

        // Reset state and hopefully get same random numbers
        Random.setGlobalState(state);
        const randNumArr2 = Util.initArrayFunc(_ => Random.randomUint32())(100);

        // We should be getting a full array match
        expect(randNumArr1).toEqual(randNumArr2);
    });

    test("invalid state vector length throws error", () => {
        const state = {
            vector: Util.initArray(0)(623),     // Bad vector length
            index: 0,
        };

        expect(() => Random.setGlobalState(state)).toThrowError();
    });
});

/// =========================
/// Tests that may be skipped
/// =========================
// This test set is skipped and shall only be run where necessary;
// This is because the randomness can only be tested by running over a large
// number of trials which consumes a fair bit of time
describe.skip("## Long running tests ##", () => {
    describe("`generateRandomSeed`", () => {
        test("returns a probabilistically different (99.9%) number in each of 1e6 runs", () => {
            const set = new Set<number>();
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                set.add(Random.generateRandomSeed());
            }

            // Threshold is 99.9% in one million (1e6)
            expect(set.size).toBeGreaterThanOrEqual(numberOfRuns * 0.999);
        });

        test("returns a uint32 in each of 1e6 runs", () => {
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                const number = Random.generateRandomSeed();
                expect(number >>> 0).toBe(number);
            }
        });
    });

    describe("`random`", () => {
        beforeEach(() => {
            // Set to a known global seed
            Random.setGlobalSeed(0);
        });

        test("returns a probabilistically different (99.9%) number in each of 1e6 runs", () => {
            const set = new Set<number>();
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                set.add(Random.random());
            }

            // Threshold is 99.9% in one million (1e6)
            expect(set.size).toBeGreaterThanOrEqual(numberOfRuns * 0.999);
        });

        test("returns a number in range [0, 1) in each of 1e6 runs", () => {
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                const number = Random.random();
                expect(number).toBeGreaterThanOrEqual(0);
                expect(number).toBeLessThan(1);
            }
        });
    });

    describe("`randomLong`", () => {
        beforeEach(() => {
            // Set to a known global seed
            Random.setGlobalSeed(0);
        });

        test("returns a probabilistically different (99.99%) number in each of 1e6 runs", () => {
            const set = new Set<number>();
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                set.add(Random.randomLong());
            }

            // Threshold is 99.99% in one million (1e6)
            expect(set.size).toBeGreaterThanOrEqual(numberOfRuns * 0.9999);
        });

        test("returns a number in range [0, 1) in each of 1e6 runs", () => {
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                const number = Random.randomLong();
                expect(number).toBeGreaterThanOrEqual(0);
                expect(number).toBeLessThan(1);
            }
        });
    });

    describe("`randomUint32`", () => {
        beforeEach(() => {
            // Set to a known global seed
            Random.setGlobalSeed(0);
        });

        test("returns a probabilistically different (99.9%) number in each of 1e6 runs", () => {
            const set = new Set<number>();
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                set.add(Random.randomUint32());
            }

            // Threshold is 99.9% in one million (1e6)
            expect(set.size).toBeGreaterThanOrEqual(numberOfRuns * 0.999);
        });

        test("returns a uint32 in each of 1e6 runs", () => {
            const numberOfRuns = 1e6;

            for (let i = 0; i < numberOfRuns; ++i) {
                const number = Random.randomUint32();
                expect(number >>> 0).toBe(number);
            }
        });
    });
});
