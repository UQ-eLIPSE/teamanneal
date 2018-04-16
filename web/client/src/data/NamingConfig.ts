export interface NamingConfig {
    combined: {
        /**
         * Describes the format with which to generate combined group
         * names
         * 
         * Formatting is done by using the stratum label in moustaches,
         * for example:
         * "Group {{Table}}-{{Team}}" might look like: "Group 2-C"
         */
        format: string | undefined,

        /**
         * Indicates if format was user provided, instead of being system 
         * generated
         */
        userProvided: boolean,
    },
}

export function initNew(combinedFormat: string | undefined = undefined, combinedFormatIsUserProvided: boolean = false) {
    const obj: NamingConfig = {
        combined: {
            format: combinedFormat,
            userProvided: combinedFormatIsUserProvided,
        },
    };

    return obj;
}
