/** `Stratum` ID or `Context` enum value */
export type StratumNamingConfigContext = string | Context;

export enum Context {
    GLOBAL = 0,
    PARTITION = 1,
}
