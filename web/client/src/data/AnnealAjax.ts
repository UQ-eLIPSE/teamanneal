import { CancelTokenSource } from "axios";

import axios from "axios";

export function cancelAnnealAjaxRequest(cancelTokenSource: CancelTokenSource | undefined) {
    if (cancelTokenSource !== undefined) {
        cancelTokenSource.cancel();
    }
}

export function createAnnealAjaxRequest(data: any) {
    const cancelTokenSource = axios.CancelToken.source();
    const request = axios.post("/api/anneal", data, {
        cancelToken: cancelTokenSource.token,
    });

    return {
        cancelTokenSource,
        request,
    }
}
