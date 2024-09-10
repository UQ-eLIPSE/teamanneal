import { AnnealCreatorState, AnnealCreatorStateSerialisable } from "../store/AnnealCreator/state";

import { init as initRecordData } from "./RecordData";
import * as AnnealRequestState from "./AnnealRequestState";

import { serialiseWithUndefined } from "../util/Object";

export function dehydrate(originalState: AnnealCreatorState | AnnealCreatorStateSerialisable, deleteAnnealRequest: boolean = false, deleteRecordDataSource: boolean = false) {
    // Copy state
    const state: AnnealCreatorState = {
        recordData: originalState.recordData,
        constraintConfig: originalState.constraintConfig,
        strataConfig: originalState.strataConfig,
        annealRequest: originalState.annealRequest || AnnealRequestState.initNotRunning(),
    };

    // Clear parts of state object, where requested

    if (deleteRecordDataSource) {
        // Wipe out everything but ID and partition columns
        state.recordData = initRecordData(
            undefined,
            undefined,
            undefined,
            originalState.recordData.idColumn,
            originalState.recordData.partitionColumn,
        );
    }

    // If annealRequest previously existed, then handle the possible removal of
    // anneal request data
    const originalAnnealRequest = originalState.annealRequest;

    if (originalAnnealRequest !== undefined) {
        if (deleteAnnealRequest) {
            // If told to delete the anneal request data when it previously
            // existed, then replace with empty "not running" object
            state.annealRequest = AnnealRequestState.initNotRunning();
        }
    } else {
        // If previously did not exist, delete property altogether
        //@ts-ignore
        delete state.annealRequest;
    }

    return serialiseWithUndefined(state);
}
