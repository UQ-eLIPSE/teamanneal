/// <reference path="../typings/mersenne-twister.d.ts" />
import * as MersenneTwister from "mersenne-twister";

/** Uint32Array object to hold one uint32 number, used for random seeding */
const __uint32 = new Uint32Array(1);

/** The MersenneTwister PRNG object */
const __generator = new MersenneTwister();



export function init() {
    const generator = new MersenneTwister();
    setRandomSeed(generator);
    return generator;
}

export function random(generator: MersenneTwister = __generator) {
    return generator.random();
}

export function randomLong(generator: MersenneTwister = __generator) {
    return generator.random_long();
}

export function randomUint32(generator: MersenneTwister = __generator) {
    return generator.random_int();
}



export function getStateVector(generator: MersenneTwister) {
    return generator.mt;
}

export function setSeed(generator: MersenneTwister, number: number) {
    return generator.init_seed(number);
}

export function setRandomSeed(generator: MersenneTwister) {
    // Use highest available entropy to set randomness
    // Fills in one uint32 number into `__uint32`
    crypto.getRandomValues(__uint32);

    // Get the random uint32 number out from the 0th index, use as seed
    const seed = __uint32[0];

    return setSeed(generator, seed);
}

export function setStateVector(generator: MersenneTwister, vector: ReadonlyArray<number>) {
    return generator.init_by_array(vector, vector.length);
}



export function setGlobalSeed(number: number) {
    return setSeed(__generator, number);
}

export function setGlobalRandomSeed() {
    return setRandomSeed(__generator);
}

export function setGlobalStateVector(vector: ReadonlyArray<number>) {
    return setStateVector(__generator, vector);
}

export function getGlobalStateVector() {
    return getStateVector(__generator);
}

// Initialised to random seed
setGlobalRandomSeed();
