import { AxiosResponse, AxiosError } from "axios";

import { DeepReadonly } from "./DeepReadonly";

import * as ToClientAnnealResponse from "../../../common/ToClientAnnealResponse";

export type AnnealResponse =
    Readonly<AnnealResponse_ContentSuccess | AnnealResponse_ContentError>;

interface AnnealResponse_ContentSuccess {
    type: "success",
    status: number,
    data?: DeepReadonly<ToClientAnnealResponse.Root>,
}

interface AnnealResponse_ContentError {
    type: "error",
    error: AxiosError | Error,
}

export function processRawResponse(response: AxiosResponse | AxiosError | Error) {
    // Determine type of response
    if (rawResponseIsError(response)) {
        const obj: AnnealResponse_ContentError = {
            type: "error",
            error: response,
        };

        return obj;
    }

    // Otherwise we say it is successful
    const obj: AnnealResponse_ContentSuccess = {
        type: "success",
        status: response.status,
        data: response.data,
    };

    return obj;
}

function rawResponseIsError(response: object): response is AxiosError | Error {
    // Errors are `AxiosError` or `Error`
    // `AxiosError` is a derivative of `Error`, so we only need to check `Error`
    return (response instanceof Error);
}

export function isError(annealResponse: AnnealResponse): annealResponse is AnnealResponse_ContentError {
    return annealResponse.type === "error";
}

export function isSuccess(annealResponse: AnnealResponse): annealResponse is AnnealResponse_ContentSuccess {
    return annealResponse.type === "success";
}

export { AxiosResponse, AxiosError } from "axios";
