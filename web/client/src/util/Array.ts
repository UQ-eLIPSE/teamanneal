/**
 * Concatentates arrays.
 */
export function concat<T>(items: ReadonlyArray<ReadonlyArray<T>>) {
    const arr: T[] = [];

    for (let i = 0; i < items.length; ++i) {
        arr.push.apply(arr, items[i]);
    }

    return arr;
}

/**
 * Returns a new copy of the array that is reversed.
 */
export function reverse<T>(array: ReadonlyArray<T>) {
    const arr: T[] = [];

    for (let i = array.length - 1; i >= 0; --i) {
        arr.push(array[i]);
    }

    return arr;
}
