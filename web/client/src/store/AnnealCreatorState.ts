import { RecordData, initNew as initRecordData } from "../data/RecordData";
import { StrataConfig, initNew as initStrataConfig } from "../data/StrataConfig";
import { ConstraintConfig, initNew as initConstraintConfig } from "../data/ConstraintConfig";

export interface AnnealCreatorState {
    /** Data for each leaf node in the group tree (individual records) */
    recordData: RecordData,

    /** Object containing all constraints used */
    constraintConfig: ConstraintConfig,

    /** Configuration of strata  */
    strataConfig: StrataConfig,
}

export function init() {
    const state: AnnealCreatorState = {
        recordData: initRecordData(),

        constraintConfig: initConstraintConfig(),

        strataConfig: initStrataConfig(),
    };

    return state;
}
