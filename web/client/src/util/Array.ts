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
