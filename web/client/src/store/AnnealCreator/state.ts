import { RecordData, init as initRecordData } from "../../data/RecordData";
import { StrataConfig, init as initStrataConfig } from "../../data/StrataConfig";
import { ConstraintConfig, init as initConstraintConfig } from "../../data/ConstraintConfig";
import { NamingConfig, init as initNamingConfig } from "../../data/NamingConfig";
import { AnnealRequestState, initNotRunning as initAnnealRequestState_NotRunning } from "../../data/AnnealRequestState";

export interface AnnealCreatorState {
    /** Data for each leaf node in the group tree (individual records) */
    recordData: RecordData,

    /** Object containing all constraints used */
    constraintConfig: ConstraintConfig,

    /** Configuration of strata  */
    strataConfig: StrataConfig,

    /** Naming configuration for nodes */
    nodeNamingConfig: NamingConfig,

    /** Anneal request/response information */
    annealRequest: AnnealRequestState,
}

export function init() {
    const state: AnnealCreatorState = {
        recordData: initRecordData(),

        constraintConfig: initConstraintConfig(),

        strataConfig: initStrataConfig(),

        nodeNamingConfig: initNamingConfig(),

        annealRequest: initAnnealRequestState_NotRunning(),
    };

    return state;
}
