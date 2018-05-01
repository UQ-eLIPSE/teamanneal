import * as ListCounter from "./ListCounter";
import { StratumNamingConfigContext, Context } from "./StratumNamingConfigContext";
import { StrataConfig } from "./StrataConfig";

export interface StratumNamingConfig {
    /** Definition of the list used for naming nodes in stratum */
    counter: ListCounter.ListCounterType | string[],

    /** 
     * The context under which names are generated
     * 
     * For example:
     * - if set to the global context, names are unique globally
     * - if set to some the parent stratum, names are unique only within
     *   the parent stratum
     */
    context: StratumNamingConfigContext,
}

export function init(counter: ListCounter.ListCounterType | string[] = "decimal", context: StratumNamingConfigContext = Context.GLOBAL) {
    const obj: StratumNamingConfig = {
        counter,
        context,
    };

    return obj;
}

export function generateRandomExampleName(namingConfig: StratumNamingConfig) {
    const counter = namingConfig.counter;

    // Generate a random value for an example name
    if (Array.isArray(counter)) {
        return generateRandomExampleNameStringArray(counter);
    } else {
        const listCounters = ListCounter.SupportedListCounters;
        const counterDesc = listCounters.find(x => x.type === counter);

        if (counterDesc === undefined) {
            throw new Error(`Counter "${counter}" not supported`);
        }

        // Generate sequence of 20 elements, and pick a random one from that
        const randomIndex = ((Math.random() * 20) >>> 0);
        return counterDesc.generator(randomIndex, 20);
    }
}

export function generateRandomExampleNameStringArray(names: ReadonlyArray<string>) {
    const counterArray = names
        .map(name => name.trim())
        .filter(name => name.length !== 0);

    // Return empty string if there are no suitable name values to use
    if (counterArray.length === 0) {
        return "";
    }

    const randomIndex = (Math.random() * counterArray.length) >>> 0;

    return counterArray[randomIndex];
}

export function getStratumNamingConfig(strataConfig: StrataConfig, stratumId: string) {
    const namingConfig = strataConfig.namingConfig;

    if (namingConfig === undefined) {
        throw new Error("Strata naming config object does not exist");
    }

    const stratumNamingConfig = namingConfig[stratumId];

    if (stratumNamingConfig === undefined) {
        throw new Error(`Stratum ID ${stratumId} does not exist in stratum naming config object`);
    }

    return stratumNamingConfig;
}
