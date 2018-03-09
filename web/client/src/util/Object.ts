export function deepCopy<T extends Object>(object: T): T {
    return JSON.parse(JSON.stringify(object));
}

// Below 2 functions are extracted from https://stackoverflow.com/a/34749873

/**
 * Simple object check.
 */
export function isObject(item: any): item is Object {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge objects.
 */
export function deepMerge<T extends Object, U extends Partial<T>>(target: T, ...sources: U[]): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            const sourceValue = source[key];

            if (isObject(sourceValue)) {
                if (!(target as any)[key]) Object.assign(target, { [key]: {} });
                deepMerge((target as any)[key], sourceValue);
            } else {
                Object.assign(target, { [key]: sourceValue });
            }
        }
    }

    return deepMerge(target, ...sources);
}

/**
 * Cleans out unneeded properties by deleting them
 */
export function deepClean<T extends Object>(target: T, definition: Object) {
    for (const key in target) {
        // Delete key in target if definition doesn't contain it
        if (!definition.hasOwnProperty(key)) {
            delete target[key];
            continue;
        }

        // Recurse down for subobjects
        const v = target[key];
        if (isObject(v)) {
            deepClean(v, (definition as any)[key]);
        }
    }
}
