export type FunctionParam2<T> =
    T extends (x: any, y: undefined) => any ? undefined :
    T extends (x: any, y: infer U) => any ? U : never;
