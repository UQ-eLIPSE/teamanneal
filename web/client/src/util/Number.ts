export function parseUint32(input: any, defaultValue: number = 0) {
    // Return value as uint32
    return parse(input, defaultValue) >>> 0;
}

export function parse(input: any, defaultValue: number = 0) {
    // Attempt to convert to number
    let value = +input;

    // Get default if number not valid
    if (Number.isNaN(value)) {
        value = defaultValue;
    }

    return value;
}
