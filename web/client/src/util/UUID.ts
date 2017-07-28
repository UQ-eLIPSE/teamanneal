import * as uuidv1 from "uuid/v1";

/**
 * Generates a UUID (version 1)
 */
export function generate() {
    return uuidv1();
}
