/*
 * StringMap
 * 
 * Stores strings and permits lookups through pointer values.
 */
export type StringPointer = number;
type __KV = StringPointer | string;

export class StringMap {
    private pointer: StringPointer = 0;
    private readonly map: Map<__KV, __KV> = new Map();

    /**
     * Returns the number of strings held in the StringMap.
     */
    public get size() {
        // We divide by 2 because both the pointer and string
        // will appear as separate entries in the Map.
        return this.map.size / 2;
    }

    /**
     * Adds string into map.
     * 
     * @returns {number} Pointer of added string. Pointer type is uint32.
     */
    public add(str: string) {
        // Check it doesn't already exist
        const existingPointer = this.findPointerOf(str);

        // If pointer returned from #findPointerOf() is a valid pointer type 
        // then we can just return the existing StringPointer
        if (StringMap.isValidPointer(existingPointer)) {
            return existingPointer;
        }

        // Create new StringMap record
        const newPointer = this.allocateNewPointer();

        // We set the string as a key and value and 
        // return the pointer
        this.map.set(str, newPointer);
        this.map.set(newPointer, str);

        return newPointer;
    }

    /**
     * Removes string from map.
     */
    public remove(str: string) {
        return this.removeAt(this.find(str));
    }

    /**
     * Removes string at pointer from map.
     */
    public removeAt(pointer: StringPointer) {
        const str = this.getStringAt(pointer);

        if (!StringMap.isValidString(str)) {
            throw new Error("Null pointer dereference");
        }

        // Delete both:
        // * pointer -> str
        // * str -> pointer
        this.map.delete(pointer);
        this.map.delete(str);

        return this;
    }

    /**
     * Gets string held at pointer location.
     */
    public get(pointer: StringPointer) {
        const str = this.getStringAt(pointer);

        if (!StringMap.isValidString(str)) {
            throw new Error("Null pointer dereference");
        }

        return str;
    }

    /**
     * Returns pointer of string.
     */
    public find(str: string) {
        const pointer = this.findPointerOf(str);

        if (!StringMap.isValidPointer(pointer)) {
            throw new Error("String not found");
        }

        return pointer;
    }



    private allocateNewPointer(): StringPointer {
        // Pointers are guaranteed to be in uint32 range
        //
        // Note that even getting to this point is **very** unlikely - you'll
        // probably exhaust memory and/or garbage collection capabilities before
        // you get to a stage where StringMap can store 2^32 strings
        if (this.pointer > 0xFFFFFFFF) {
            throw new Error("Maximum pointer allocation reached");
        }

        return this.pointer++;
    }

    private getStringAt(pointer: StringPointer): string | undefined {
        return this.map.get(pointer) as (string | undefined);
    }

    private findPointerOf(str: string): StringPointer | undefined {
        return this.map.get(str) as (StringPointer | undefined);
    }

    private static isValidPointer(pointer: StringPointer | undefined): pointer is StringPointer {
        return typeof pointer === "number";
    }

    private static isValidString(str: string | undefined): str is string {
        return typeof str === "string";
    }
}
