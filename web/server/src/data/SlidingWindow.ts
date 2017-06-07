import * as Util from "../core/Util";

export interface SlidingWindow<T> {
    readonly data: ReadonlyArray<T>,
    readonly size: number,
    readonly filled: number,
}

interface SlidingWindowUnsafe<T> {
    data: T[],
    size: number,
    filled: number,
}

/** 
 * This is a reference prototype so that some JavaScript engines can better
 * optimise property lookups against all SlidingWindows.
 * 
 * This seems to be particularly true of V8 (Chrome/Node.js).
 */
const __rootPrototype = Object.create(null);

export function init<T>(size: number, value?: T) {
    const sw: SlidingWindowUnsafe<T> = Object.create(__rootPrototype);

    sw.size = size;

    if (value === undefined) {
        sw.data = new Array<T>(size);
        sw.filled = 0;
    } else {
        sw.data = Util.initArray(value)(size);
        sw.filled = size;
    }

    return sw as SlidingWindow<T>;
}

export function push<T>(slidingWindow: SlidingWindow<T>, element: T) {
    const sw = slidingWindow as SlidingWindowUnsafe<T>;

    // We don't actually do an Array#push - instead we place the element at the
    // start of the array and pop the last one off.
    // This is so that the array is [newest, ..., oldest] in that order.
    const arr = sw.data;
    arr.pop();
    arr.unshift(element);

    // Increment the buffer filled indicator
    if (sw.filled < sw.size) {
        sw.filled++;
    }

    return sw as SlidingWindow<T>;
}

export function avg(slidingWindow: SlidingWindow<number>) {
    const arrayLength = slidingWindow.filled;

    if (arrayLength === 0) {
        return 0;
    }

    let sum = 0;
    const arr = slidingWindow.data;

    for (let i = 0; i < arrayLength; ++i) {
        sum += arr[i];
    }

    return sum / arrayLength;
}
