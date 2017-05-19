import * as Stratum from "../../../common/Stratum";

export interface ConstraintsConfig {
    idColumnIndex: number,
    partitionColumnIndex: number,

    strata: Stratum.Desc[],
}
