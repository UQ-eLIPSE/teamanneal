import Vue from "vue";

/** Type-safe Vue.set() */
export const set: {
    <O extends object, K extends keyof O, T extends O[K]>(object: O, key: K, value: T): T;
    <T>(array: T[], key: number, value: T): T;
} = Vue.set;

/** Type-safe Vue.delete() */
export const del: {
    <O extends object, K extends keyof O>(object: O, key: K): void;
    <T>(array: T[], key: number): void;
} = Vue.delete;
