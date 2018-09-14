import * as Random from "../data/Random";

/*
 * Util
 * 
 * Utility functions
 */

/// Random numbers

/**
 * Generates random float64.
 */
export const randFloat64 = Random.randomLong;

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



/// Arrays

/**
 * Creates an array of certain size, initialised by a function.
 */
export const initArrayFunc =
    <T>(valueFunc: (i: number) => T) =>
        (size: number) => {
            const array = new Array<T>(size >>> 0);

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
 * Concatentates arrays.
 */
export function concatArrays<T>(items: ReadonlyArray<ReadonlyArray<T>>) {
    const arr: T[] = [];

    for (let i = 0; i < items.length; ++i) {
        arr.push.apply(arr, items[i]);
    }

    return arr;
}

/// Numeric arrays

/**
 * Calculates average of values in numeric array.
 */
export const avg =
    (arr: ReadonlyArray<number>) => {
        const size = arr.length;

        let sum: number = 0;

        for (let i = 0; i < size; ++i) {
            sum = sum + arr[i];
        }

        return sum / size;
    }

/**
 * Calculates standard deviation of values in numeric array.
 */
export const stdDev =
    (arr: ReadonlyArray<number>) => {
        const size = arr.length;
        const average = avg(arr);

        // You can't compute a standard deviation of an array with one or fewer
        // elements
        if (size <= 1) {
            throw new Error("Array must be of size greater than 1");
        }

        let sumOfSquareDiffs: number = 0;

        for (let i = 0; i < size; ++i) {
            sumOfSquareDiffs = sumOfSquareDiffs + (arr[i] - average) ** 2;
        }

        return Math.sqrt(sumOfSquareDiffs / (size - 1));
    }

/**
 * Sorts a number array by numeric value rather than by string representation.
 */
export function numberSort(array: number[]) {
    array.sort((a, b) => a - b);

    // Side effects present - do not return value
    return;
}


/// Objects

export function zipObjects<U extends object, V extends object>(o1: U, o2: V): U & V {
    const target: any = {};

    for (let k1 in o1) {
        target[k1] = o1[k1];
    }

    for (let k2 in o2) {
        target[k2] = o2[k2];
    }

    return target;
}
