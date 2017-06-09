import * as Util from "../../core/Util";

import * as Random from "../Random";

describe("`init`", () => {
    test("initialises a new generator", () => {
        const oldGenerator = Random.getGenerator();

        Random.init();

        const newGenerator = Random.getGenerator();

        expect(newGenerator).not.toBe(oldGenerator);
    });
});

describe("`setGlobalSeed`", () => {
    test("changes global PRNG state vector", () => {
        // We have to Array#slice() the state vectors as the array **object**
        // is being returned and will be mutated as part of the global generator
        Random.setGlobalSeed(0);
        const stateVector1 = Random.getGenerator().mt.slice();

        Random.setGlobalSeed(1);
        const stateVector2 = Random.getGenerator().mt.slice();

        // We should not be getting a full array match
        const length = stateVector1.length;
        let numberOfSames: number = 0;

        for (let i = 0; i < stateVector1.length; ++i) {
            if (stateVector1[i] === stateVector2[i]) {
                ++numberOfSames;
            }
        }

        expect(numberOfSames).not.toBe(length);
    });
});

describe("`setGlobalRandomSeed`", () => {
    test("changes global PRNG state vector", () => {
        // We have to Array#slice() the state vectors as the array **object**
        // is being returned and will be mutated as part of the global generator
        Random.setGlobalRandomSeed();
        const stateVector1 = Random.getGenerator().mt.slice();

        Random.setGlobalRandomSeed();
        const stateVector2 = Random.getGenerator().mt.slice();

        // We should not be getting a full array match
        const length = stateVector1.length;
        let numberOfSames: number = 0;

        for (let i = 0; i < stateVector1.length; ++i) {
            if (stateVector1[i] === stateVector2[i]) {
                ++numberOfSames;
            }
        }

        expect(numberOfSames).not.toBe(length);
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
