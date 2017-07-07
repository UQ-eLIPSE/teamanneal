export function parseUint32(str: string, defaultValue: number = 0) {
    // Attempt to convert number to string
    let value = +str;

    // Get default if number not valid
    if (Number.isNaN(value)) {
        value = defaultValue;
    }

    // Return value as uint32
    return value >>> 0;
}
