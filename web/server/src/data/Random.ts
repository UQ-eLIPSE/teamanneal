import * as crypto from "crypto";
import { MT19937 } from "./MT19937";

/** The MersenneTwister PRNG object */
let __generator: MT19937;

init(); // Initialise now!

export function init() {
    setSeed(generateRandomSeed());
}

export function setSeed(seed: number) {
    __generator = new MT19937();
    __generator.init_genrand(seed);
}

export function generateRandomSeed() {
    // Endianness doesn't matter in this case because we're just concerned with
    // just getting a purely random seed integer
    return crypto.randomBytes(4).readUInt32LE(0);
}

export function random(generator = __generator) {
    return generator.genrand_real2();
}

export function randomLong(generator = __generator) {
    return generator.genrand_res53();
}

export function randomUint32(generator = __generator) {
    return generator.genrand_int32();
}
