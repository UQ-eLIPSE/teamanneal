import __config from "../../config/example.json";

// Using the example config file as the expected type
type ConfigurationObject = typeof __config;

export namespace Config {
    // Cache for config
    const configMap: Map<string, ConfigurationObject> = new Map();

    /**
     * Returns configuration object
     * @param environment Environment that maps to the name of the config file
     */
    export function get(environment: string = process.env.NODE_ENV || "development") {
        // If already loaded, return that
        if (configMap.has(environment)) {
            return configMap.get(environment)!;
        }

        // Otherwise import and return
        const config: ConfigurationObject = require(`${__dirname}/../../../../config/${environment}.json`);
        configMap.set(environment, config);
        return config;
    }
}
