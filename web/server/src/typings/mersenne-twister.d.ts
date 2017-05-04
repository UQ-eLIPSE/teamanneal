// Type definitions for mersenne-twister 1.1.0
// https://github.com/boo1ean/mersenne-twister

declare module "mersenne-twister" {
    class MersenneTwister {
        constructor(seed?: number | ReadonlyArray<number>);

        /** Initializes mt[N] with a seed */
        init_seed(seed: number): void;
        /**
         * Initialize by an array with array-length
         * @param vector The array for initializing keys
         * @param length Vector length
         */
        init_by_array(vector: ReadonlyArray<number>, length: number): void;

        /** Generates a random number on [0,0xffffffff]-interval */
        random_int(): number;
        /** Generates a random number on [0,0x7fffffff]-interval */
        random_int31(): number;
        /** Generates a random number on [0,1]-real-interval */
        random_incl(): number;
        /** Generates a random number on [0,1)-real-interval */
        random(): number;
        /** Generates a random number on (0,1)-real-interval */
        random_excl(): number;
        /** Generates a random number on [0,1) with 53-bit resolution */
        random_long(): number;

        /** Period parameter N */
        readonly N: number;
        /** Period parameter M */
        readonly M: number;
        /** Constant vector a */
        readonly MATRIX_A: number;
        /** Most significant w-r bits */
        readonly UPPER_MASK: number;
        /** Least significant r bits */
        readonly LOWER_MASK: number;

        /** The array for the state vector */
        readonly mt: ReadonlyArray<number>;
        /** mti==N+1 means mt[N] is not initialised */
        readonly mti: number;
    }
    namespace MersenneTwister { }
    export = MersenneTwister;
}
