const randUint32 =
    (() => {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            return () => {
                // Create a random 32 bit uint
                const uint32Arr = new Uint32Array(1);
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

const randFloat64 =
    (() => {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            return () => {
                // Create random 64 bits
                const uint32Arr = new Uint32Array(2);
                crypto.getRandomValues(uint32Arr);

                // [0, 1) in IEEE754/double has 52 bits (13 nibbles) in fraction
                // so we need to create an int that fits within that range then
                // divide by 52 bits to get a float
                //
                // Based on http://stackoverflow.com/questions/13694626/generating-random-numbers-0-to-1-with-crypto-generatevalues#comment18805210_13694869
                const bottom = uint32Arr[0] & 0xFFFFF;  // 20 bits
                const top = uint32Arr[1] * 0x100000;    // 32 bits, shifted left by 20 bits

                // top + bottom can saturate 52 bits; must divide by one greater
                // to guarantee [0, 1)
                return (top + bottom) / (0xFFFFFFFFFFFFF + 1);
            };
        } else {
            return () => {
                // Fallback using Math.random()
                return Math.random();
            };
        }
    })();

/**
* Generates random integer in uint32 range.
* 
* @param {number} high Ceiling for random integer (noninclusive); must be uint32
*/
export const generateRandomIntTo =
    (high: number) => {
        // Limit must be uint32
        const limit = high >>> 0;

        // Special case: x % 0 = NaN
        if (limit === 0) {
            return 0;
        }

        // Pick a random integer by doing a modulo
        return randUint32() % limit;
    }

export const generateRandomFloat = randFloat64;

export const generateRandomIntDist =
    (dist: ReadonlyArray<number>) => randomIntDistGenerator(dist)();

export const randomIntDistGenerator =
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
            const randThreshold = generateRandomFloat() * sum;

            const randomInt = distThresholds.findIndex(distThreshold => randThreshold < distThreshold);

            if (randomInt < 0) {
                throw new Error("Bounds for random integer distribution violated");
            }

            return randomInt;
        }
    }
