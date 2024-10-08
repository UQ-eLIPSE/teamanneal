/*
 * StringMap
 * 
 * Stores strings and permits lookups through pointer values.
 */
import * as Util from "./Util";

export type StringPointer = number;
type __KV = StringPointer | string;

export interface StringMap extends Map<__KV, __KV | undefined> {
}



export const init =
    (): StringMap => {
        return new Map();
    }

/**
 * Adds string into map.
 */
export const add =
    (map: StringMap) =>
        (str: string) => {
            // Check it doesn't already exist
            const existingPointer = _find(map)(str);

            if (isValidPointer(existingPointer)) {
                return existingPointer;
            }

            // Create new StringMap record
            const newPointer: StringPointer = size(map);

            // We set the string as a key and value and 
            // return the pointer
            map.set(str, newPointer);
            map.set(newPointer, str);

            return newPointer;
        }

/**
 * Removes string from map.
 */
export const remove =
    (map: StringMap) =>
        (str: string) => {
            return removeAt(map)(find(map)(str));
        }

/**
 * Removes string at pointer from map.
 */
export const removeAt =
    (map: StringMap) =>
        (pointer: StringPointer) => {
            const str = _get(map)(pointer);

            if (!isValidString(str)) {
                return Util.throwErr(new Error("StringMap: Null pointer dereference"));
            }

            // Erase via. `undefined` rather than .remove()
            // because size() is used for pointers
            map.set(str, undefined);
            map.set(pointer, undefined);

            return map;
        }

/**
 * Returns the number of strings held in map, including removed strings.
 */
export const size =
    (map: StringMap) => {
        // We divide by 2 because both the pointer and string
        // will appear as separate entries in the Map.
        return map.size / 2;
    }

/**
 * Gets string held at pointer location.
 */
export const get =
    (map: StringMap) =>
        (pointer: StringPointer) => {
            const str = _get(map)(pointer);

            return isValidString(str) ?
                str :
                Util.throwErr(new Error("StringMap: Null pointer dereference"));
        }

/**
 * Returns pointer of string.
 */
export const find =
    (map: StringMap) =>
        (str: string) => {
            const pointer = _find(map)(str);

            return isValidPointer(pointer) ?
                pointer :
                Util.throwErr(new Error("StringMap: String not found"));
        }



const _get =
    (map: StringMap) =>
        (pointer: StringPointer): string | undefined => {
            return map.get(pointer) as (string | undefined);
        }

const _find =
    (map: StringMap) =>
        (str: string): StringPointer | undefined => {
            return map.get(str) as (StringPointer | undefined);
        }

const isValidPointer =
    (pointer: StringPointer | undefined): pointer is StringPointer => typeof pointer === "number";

const isValidString =
    (str: string | undefined): str is string => typeof str === "string";
