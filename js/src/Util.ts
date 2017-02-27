export const repeat =
    (f: Function) =>
        (i: number) => {
            i |= 0; // Int only

            while (i-- > 0) {
                f();
            }
        }


export const uint32 =
    (x: number) => x >>> 0;

export const int32 =
    (x: number) => x | 0;

export const initArray =
    <T>(value: T) =>
        (size: number) =>
            new Array<T>(uint32(size)).fill(value);

export const blankArray =
    initArray(undefined)

export const readonlyArray =
    <T>(arr: Array<T>) => arr as ReadonlyArray<T>;

export const copyArray =
    <T>(arr: ReadonlyArray<T>) => arr.slice();

/**
 * Timestamp in seconds
 */
export const timestamp =
    () => Date.now() / 1000;    // JS produces millisecond time from Date.now()

/**
 * Timer in milliseconds
 */
export const timer =
    (lastTime?: number) => {
        if (lastTime) {
            return performance.now() - lastTime;
        }

        return performance.now();
    }

export const avg =
    (values: ReadonlyArray<number>) => {
        return values.reduce(
            (sum, value) => sum + value,
            0
        ) / values.length;
    }

export const stdDev =
    (values: ReadonlyArray<number>) => {
        const size = values.length;
        const average = avg(values);

        const sumOfSquareDiffs = values.reduce(
            (sum, value) => sum + (value - average) ** 2,
            0
        );

        return Math.sqrt(sumOfSquareDiffs / (size - 1));
    }