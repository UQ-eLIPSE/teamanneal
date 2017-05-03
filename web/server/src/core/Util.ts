/*
 * Util
 * 
 * Utility functions
 */

/// Random numbers

/**
 * Generates random uint32.
 */
export const randUint32 =
    (() => {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            // Reusing array for getRandomValues across executions
            const uint32Arr = new Uint32Array(1);

            return () => {
                // Fill random 32 bits
                crypto.getRandomValues(uint32Arr);
                return uint32Arr[0];
            };
        } else {
            return () => {
                // Fallback using Math.random()
                return (Math.random() * 0xFFFFFFFF) >>> 0;
            };
        }
    })();

/**
 * Generates random float64.
 */
export const randFloat64 =
    (() => {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            // Reusing array for getRandomValues across executions
            const uint32Arr = new Uint32Array(2);

            return () => {
                let result: number;

                do {
                    // Fill random 64 bits
                    crypto.getRandomValues(uint32Arr);

                    // [0, 1) in IEEE754/double has 52 bits (13 nibbles) in fraction
                    // so we need to create an int that fits within that range then
                    // divide by 52 bits to get a float
                    //
                    // Based on http://stackoverflow.com/questions/13694626/generating-random-numbers-0-to-1-with-crypto-generatevalues#comment18805210_13694869
                    const bottom = uint32Arr[0] & 0xFFFFF;  // 20 bits
                    const top = uint32Arr[1] * 0x100000;    // 32 bits, shifted left by 20 bits

                    result = (top + bottom) / 0xFFFFFFFFFFFFF;
                } while (result | 0); // top + bottom can saturate 52 bits, so we need to check if it's 1

                return result;
            };
        } else {
            return () => {
                // Fallback using Math.random()
                return Math.random();
            };
        }
    })();

/**
 * Generates random uint32 in range [0, n).
 */
export const randUint32Limit =
    (n: number) => {
        // Limit must be uint32
        const limit = uint32(n);

        // Special case: x % 0 = NaN
        if (limit === 0) {
            return 0;
        }

        // Pick a random integer by doing a modulo
        return randUint32() % limit;
    }

/**
 * Creates a function that will generate a random uint32 for a given distribution array.
 * 
 * e.g. Input
 *          dist = [0.1, 0.5, 0.2, 0.2]
 *      will return a random number generator that generates the values:
 *          0 (p=0.1),
 *          1 (p=0.5),
 *          2 (p=0.2),
 *          3 (p=0.2).
 */
export const randUint32DistGenerator =
    (dist: ReadonlyArray<number>) => {
        const sum = dist.reduce((acc, val) => acc + val, 0);
        const distThresholds = dist.reduce(
            (arr, val) => {
                arr.push(val + (arr[arr.length - 1] || 0))
                return arr;
            },
            [] as number[]
        );

        return () => {
            const randThreshold = randFloat64() * sum;

            // Find index where the random threshold is exceeded
            // by the distribution threshold.
            // This becomes the random integer.
            for (let i = 0; i < distThresholds.length; ++i) {
                if (randThreshold < distThresholds[i]) {
                    return i;
                }
            }

            throw new Error("Bounds for random integer distribution violated");
        }
    }



/// Numbers

/**
 * Converts number to uint32.
 */
export const uint32 =
    (x: number) => x >>> 0;

/**
 * Converts number to int32.
 */
export const int32 =
    (x: number) => x | 0;

/**
 * Determines if value represents `true`.
 */
export const isTrue =
    (val: number) => val !== 0;

/**
 * Determines if value represents `false`.
 */
export const isFalse =
    (val: number) => val === 0;

/**
 * Determines if numeric value is `NaN`.
 */
export const isNaN =
    (val: number) => val !== val;

export const boolToInt =
    (bool: boolean) => ~~bool;

export const intToBool =
    (int: number) => !!int;


/// Arrays

/**
 * Creates an array of certain size, initialised by a function.
 */
export const initArrayFunc =
    <T>(valueFunc: (i: number) => T) =>
        (size: number) => {
            const array = new Array<T>(uint32(size));

            for (let i = 0; i < array.length; ++i) {
                array[i] = valueFunc(i);
            }

            return array;
        }

/**
 * Creates an array of certain size, initialised to a certain value.
 */
export const initArray =
    <T>(value: T) => initArrayFunc(_ => value);

/**
 * Creates an array of certain size, initialised to `undefined`.
 */
export const blankArray = initArray(undefined);

/**
 * Identity function that assists in TypeScript type conversion from
 * standard Array<T> to ReadonlyArray<T>.
 */
export const readonlyArray =
    <T>(arr: Array<T>) => arr as ReadonlyArray<T>;

/**
 * Creates an array of certain size, initialised to [0..size-1]
 */
export const initArrayRange =
    (size: number) => {
        const array = new Array(uint32(size));

        for (let i = 0; i < array.length; ++i) {
            array[i] = i;
        }

        return array;
    }

/**
 * Returns shallow copy of array, shuffled randomly.
 */
export function shuffleArray<T>(items: ReadonlyArray<T>) {
    // Shallow copy
    const arr = shallowCopyArray(items);

    // In place shuffle the copied array
    // Based on http://stackoverflow.com/a/12646864
    for (let i = arr.length - 1; i > 0; i--) {
        let j = (Math.random() * (i + 1)) >>> 0;
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    return arr;
}

/**
 * Shallow copies an array.
 */
export function shallowCopyArray<T>(items: ReadonlyArray<T>) {
    const arr: T[] = [];

    for (let i = 0; i < items.length; ++i) {
        arr[i] = items[i];
    }

    return arr;
}


/// Numeric arrays

/**
 * Calculates average of values in numeric array.
 */
export const avg =
    (arr: ReadonlyArray<number>) => {
        return arr.reduce(
            (sum, value) => sum + value,
            0
        ) / arr.length;
    }

/**
 * Calculates standard deviation of values in numeric array.
 */
export const stdDev =
    (arr: ReadonlyArray<number>) => {
        const size = arr.length;
        const average = avg(arr);

        const sumOfSquareDiffs = arr.reduce(
            (sum, value) => sum + (value - average) ** 2,
            0
        );

        return Math.sqrt(sumOfSquareDiffs / (size - 1));
    }




/// Time

/**
 * Returns timestamp in seconds.
 */
export const timestamp =
    () => Date.now() / 1000;    // JS produces millisecond time from Date.now()

/**
 * Timer in milliseconds.
 */
export const timer = (() => {
    const timeFunc = typeof performance !== "undefined" ?
        () => performance.now() :
        (() => {
            // console.log("Using `Date.now()` for timer");
            return () => Date.now();
        })();

    return (lastTime?: number) => {
        if (lastTime) {
            return timeFunc() - lastTime;
        }

        return timeFunc();
    }
})();




/// Exceptions
/**
 * Throws given Error.
 */
export const throwErr =
    (error: Error) => {
        throw error;
    }
