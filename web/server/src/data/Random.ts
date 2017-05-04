/// <reference path="../typings/mersenne-twister.d.ts" />
import * as MersenneTwister from "mersenne-twister";

/** Uint32Array object to hold one uint32 number, used for random seeding */
const __uint32 = new Uint32Array(1);

/** The MersenneTwister PRNG object */
const __generator = new MersenneTwister();



export function random() {
    return __generator.random();
}

export function randomLong() {
    return __generator.random_long();
}

export function randomUint32() {
    return __generator.random_int();
}

export function setGlobalSeed(number: number) {
    return __generator.init_seed(number);
}

export function setGlobalRandomSeed() {
    // Use highest available entropy to set randomness
    // Fills in one uint32 number into `__uint32`
    crypto.getRandomValues(__uint32);

    // Get the random uint32 number out from the 0th index, use as seed
    const seed = __uint32[0];

    return setGlobalSeed(seed);
}

export function setGlobalStateVector(vector: number[]) {
    return __generator.init_by_array(vector, vector.length);
}

export function getGlobalStateVector() {
    return __generator.mt;
}

// Initialised to random seed
setGlobalRandomSeed();
