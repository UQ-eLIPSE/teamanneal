import * as MersenneTwister from "mersenne-twister";
import * as crypto from "crypto";

import * as Util from "../core/Util";

interface RandomState {
    readonly vector: ReadonlyArray<number>,
    readonly index: number,
}


/** The MersenneTwister PRNG object */
const __generator = new MersenneTwister();


export function init() {
    const generator = new MersenneTwister();
    setRandomSeed(generator);
    return generator;
}

export function generateRandomSeed() {
    // Endianness doesn't matter in this case because we're just concerned with
    // just getting a purely random seed integer
    return crypto.randomBytes(4).readUInt32LE(0);
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



function getStateVector(generator: MersenneTwister) {
    // Shallow copy required to prevent direct access to .mt array object
    return Util.shallowCopyArray(generator.mt);
}

function getStateIndex(generator: MersenneTwister) {
    return generator.mti;
}

export function getState(generator: MersenneTwister) {
    const state: RandomState = {
        vector: getStateVector(generator),
        index: getStateIndex(generator),
    }

    return state;
}

function setStateVector(generator: MersenneTwister, vector: ReadonlyArray<number>) {
    // Check length is right
    if (generator.N !== vector.length) {
        throw new Error(`Vector must be of length ${generator.N}`);
    }

    // Vector must be uint32[]
    vector = vector.map(el => el >>> 0);

    // Deliberately permit changing .mt by annotating `generator` as any
    return (generator as any).mt = vector;
}

function setStateIndex(generator: MersenneTwister, index: number) {
    // Deliberately permit changing .mti by annotating `generator` as any
    return (generator as any).mti = index;
}

export function setState(generator: MersenneTwister, state: RandomState) {
    setStateVector(generator, state.vector);
    setStateIndex(generator, state.index);
}

export function setSeed(generator: MersenneTwister, number: number) {
    return generator.init_seed(number);
}

export function setRandomSeed(generator: MersenneTwister) {
    return setSeed(generator, generateRandomSeed());
}




export function setGlobalSeed(number: number) {
    return setSeed(__generator, number);
}

export function setGlobalRandomSeed() {
    return setRandomSeed(__generator);
}

export function setGlobalState(state: RandomState) {
    return setState(__generator, state);
}

export function getGlobalState() {
    return getState(__generator);
}

// Initialised to random seed
setGlobalRandomSeed();
