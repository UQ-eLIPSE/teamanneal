import axios, { AxiosPromise } from "axios";

import * as Stratum from "../../../common/Stratum";
import * as AnnealNode from "../../../common/AnnealNode";
import * as Constraint from "../../../common/Constraint";
import * as RecordData from "../../../common/RecordData";
import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as UUID from "../util/UUID";

/**
 * Holds unique string tokens for a AxiosPromise object, used for identifying
 * requests
 */
const requestTokenMap = new WeakMap<AxiosPromise, string>();

export function packageRequestBody(recordData: RecordData.Desc, strata: Stratum.Desc[], constraints: Constraint.Desc[], annealNodes: AnnealNode.NodeRoot[]) {
    const requestBody: ToServerAnnealRequest.Root = {
        recordData,
        strata,
        constraints,
        annealNodes,
    };

    return requestBody;
}

export function createRequest(body: ToServerAnnealRequest.Root, token: string = UUID.generate()) {
    // Create a cancellation token
    // This is used in event of overlapping requests
    const cancelTokenSource = axios.CancelToken.source();

    const request = axios.post(`/api/satisfaction/calculate`, body, {
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
