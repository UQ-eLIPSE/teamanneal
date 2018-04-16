import { Stratum } from "./Stratum";
import { StratumNamingConfig } from "./StratumNamingConfig";

export interface StrataConfig {
    strata: Stratum[],

    namingConfig?: StrataConfigNamingConfigMap,
}

interface StrataConfigNamingConfigMap {
    [stratumId: string]: StratumNamingConfig,
}

export function initNew(strata: Stratum[] = [], namingConfig?: StrataConfigNamingConfigMap) {
    const obj: StrataConfig = {
        strata,
        namingConfig,
    };

    return obj;
}
