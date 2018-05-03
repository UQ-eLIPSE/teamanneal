import axios, { AxiosPromise } from "axios";

import * as Stratum from "../../../common/Stratum";
import * as AnnealNode from "../../../common/AnnealNode";
import * as Constraint from "../../../common/Constraint";
import * as RecordData from "../../../common/RecordData";
import { ToServerSatisfactionTestPermutationRequest, MoveRecordTestPermutationOperationInfo, SwapRecordsTestPermutationOperationInfo } from "../../../common/ToServerSatisfactionTestPermutationRequest";

import * as UUID from "../util/UUID";

/**
 * Holds unique string tokens for a AxiosPromise object, used for identifying
 * requests
 */
const requestTokenMap = new WeakMap<AxiosPromise, string>();

export function packageRequestBody(recordData: RecordData.Desc, strata: Stratum.Desc[], constraints: Constraint.Desc[], annealNodes: AnnealNode.NodeRoot[], operation: MoveRecordTestPermutationOperationInfo | SwapRecordsTestPermutationOperationInfo) {
    const requestBody: ToServerSatisfactionTestPermutationRequest = {
        recordData,
        strata,
        constraints,
        annealNodes,
        operation,
    };

    return requestBody;
}

export function createRequest(type: "move-record" | "swap-records", body: ToServerSatisfactionTestPermutationRequest, token: string = UUID.generate()) {
    // Create a cancellation token
    // This is used in event of overlapping requests
    const cancelTokenSource = axios.CancelToken.source();

    const request = axios.post(`/api/satisfaction/test-permutation/${type}`, body, {
        cancelToken: cancelTokenSource.token,
    });

    setRequestToken(request, token);

    return {
        cancelTokenSource,
        request,
        token,
    };
}

export function setRequestToken(request: AxiosPromise, token: string) {
    requestTokenMap.set(request, token);
}

export function getRequestToken(request: AxiosPromise) {
    return requestTokenMap.get(request);
}
