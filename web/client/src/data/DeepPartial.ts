type DeepPartialValue<V> =
    // Preserve array types
    V extends ReadonlyArray<infer U> ? ReadonlyArray<U> :
    V extends Array<infer U> ? Array<U> :

    // Recursive Partial<T> for objects
    V extends object ? DeepPartial<V> :

    // Otherwise we have a primitive and return just its type at the end
    V;

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartialValue<T[P]>;
}
