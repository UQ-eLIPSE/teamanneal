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

/**
 * Fills gaps in a 2D array with `undefined` so as to shape it into a perfect
 * "rectangle".
 * 
 * Performs operations in-place.
 */
export function fillGaps<T>(twoDimArr: (T | undefined)[][]) {
    // Pick up maximum 2nd dimension size ("row" size)
    let maxRowSize = 0;

    for (let i = 0; i < twoDimArr.length; ++i) {
        const thisRowLength = twoDimArr[i].length;

        if (thisRowLength > maxRowSize) {
            maxRowSize = thisRowLength;
        }
    }

    // Go into each row again and now append `undefined` to fill up remaining
    // space
    for (let i = 0; i < twoDimArr.length; ++i) {
        const thisRow = twoDimArr[i];

        for (let j = thisRow.length; j < maxRowSize; ++j) {
            thisRow.push(undefined);
        }
    }

    // Do not return a value - this indicates it operates in place
    return;
}

/**
 * Transposes a 2D array.
 */
export function transpose<T>(rows: T[][]) {
    if (rows.length === 0) {
        throw new Error("No elements in 2D array");
    }

    // Pick up number of columns from size of first row
    const numberOfColumns = rows[0].length;

    // Initialise the 2D array for columns
    const columns: T[][] = [];

    for (let i = 0; i < numberOfColumns; ++i) {
        columns.push([]);
    }

    // Go into each row again and now append values into each column as
    // appropriate
    for (let i = 0; i < rows.length; ++i) {
        const thisRow = rows[i];

        for (let j = 0; j < numberOfColumns; ++j) {
            const columnValues = columns[j];
            const rowElementValue = thisRow[j];

            columnValues.push(rowElementValue);
        }
    }

    return columns;
}

/**
 * Finds all indices where searchElement is found in array.
 * 
 * From https://stackoverflow.com/a/20798567
 */
export function allIndexOf<T>(array: ReadonlyArray<T>, searchElement: T) {
    const indices = [];

    for (let i = 0; i < array.length; ++i) {
        if (array[i] === searchElement) {
            indices.push(i);
        }
    }

    return indices;
}

/**
 * Filters an array by passing through only elements at the given indices.
 */
export function indexFilter<T>(array: ReadonlyArray<T>, indices: ReadonlyArray<number>) {
    const filteredArray: T[] = [];

    for (let i = 0; i < indices.length; ++i) {
        filteredArray.push(array[indices[i]]);
    }

    return filteredArray;
}

/**
 * Randomly shuffles array in place.
 */
export function shuffleInPlace<T>(array: T[]) {
    // Based on http://stackoverflow.com/a/12646864
    let j: number;
    let temp: T;
    for (let i = array.length - 1; i > 0; i--) {
        j = (Math.random() * (i + 1)) >>> 0;
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

/**
 * Sorts a number array by numeric value rather than by string representation.
 */
export function numberSort(array: number[]) {
    array.sort((a, b) => a - b);

    // Side effects present - do not return value
    return;
}
