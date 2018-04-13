import { DataWithoutNamingConfig as Stratum } from "./Stratum";

export interface StrataConfig {
    strata: Stratum[],
}

export function initNew() {
    const obj: StrataConfig = {
        strata: [],
    };

    return obj;
}
