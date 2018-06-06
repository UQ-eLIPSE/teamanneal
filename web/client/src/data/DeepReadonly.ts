type DeepReadonlyValue<V> =
    // Arrays get transformed
    V extends ReadonlyArray<infer U> ? ReadonlyArray<DeepReadonly<U>> :
    V extends Array<infer U> ? ReadonlyArray<DeepReadonly<U>> :

    // Recursive Readonly<T> for objects
    V extends object ? DeepReadonly<V> :

    // Otherwise
    Readonly<V>;

export type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonlyValue<T[P]>;
}
