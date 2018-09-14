import crypto from "crypto";
import { MT19937 } from "./MT19937";

/** The Mersenne Twister PRNG object */
let __generator: MT19937;

init(); // Initialise now!


/**
 * Returns the generator object used by Random.
 * 
 * @returns {MT19937} Global MT19937 generator object
 */
export function getGenerator() {
    return __generator;
}

/**
 * Initialises a new global MT19937 generator for Random.
 * 
 * @param {boolean} setRandomSeed Whether a random seed should be set upon initialisation [default = true]
 */
export function init(setRandomSeed: boolean = true) {
    __generator = new MT19937();

    if (setRandomSeed) {
        setGlobalRandomSeed();
    }
}

/**
 * Sets the seed of the global MT19937 generator.
 * 
 * @param {number} seed The seed value (uint32)
 */
export function setGlobalSeed(seed: number) {
    return __generator.init_genrand(seed);
}

/**
 * Sets the seed of the global MT19937 generator to a random uint32.
 */
export function setGlobalRandomSeed() {
    return setGlobalSeed(generateRandomSeed());
}

/**
 * Generates a random uint32 value from a high quality randomness source for the
 * intended purpose of seeding a PRNG.
 * 
 * @returns {number} Random uint32 number
 */
export function generateRandomSeed() {
    // Endianness doesn't matter in this case because we're just concerned with
    // just getting a purely random seed integer
    return crypto.randomBytes(4).readUInt32LE(0);
}

/**
 * Generates a random number on the [0,1) real interval.
 * 
 * @returns {number} Random number in range [0,1)
 */
export function random() {
    return __generator.genrand_real2();
}

/**
 * Generates a random number on the [0,1) real interval, with 53-bit resolution.
 * 
 * @returns {number} Random number in range [0,1), with 53-bit resolution.
 */
export function randomLong() {
    return __generator.genrand_res53();
}

/**
 * Generates a random uint32 number.
 * 
 * @returns {number} Random uint32 number
 */
export function randomUint32() {
    return __generator.genrand_int32();
}
