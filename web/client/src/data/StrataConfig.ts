import { DataWithoutNamingConfig as Stratum } from "./Stratum";

export interface StrataConfig {
    strata: Stratum[],
}

export function initNew() {
    return {
        strata: [],
    } as StrataConfig;
}
