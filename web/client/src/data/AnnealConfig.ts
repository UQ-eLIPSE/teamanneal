import { Data as IStratum } from "./Stratum";
import { Data as IConstraint } from "./Constraint";

export interface AnnealConfig {
    strata: IStratum[],

    namingConfig: {
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
             * sgenerated
             */
            userProvided: boolean,
        },
    },

    constraints: IConstraint[],
}
