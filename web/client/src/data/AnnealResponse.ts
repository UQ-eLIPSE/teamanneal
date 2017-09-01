import { AxiosResponse, AxiosError } from "axios";

import { Data as IAnnealRequest } from "./AnnealRequest";

export type Data =
    Data_ContentSuccess |
    Data_ContentError |
    Data_ContentUndefined;

interface Data_ContentSuccess {
    readonly request: IAnnealRequest,
    content: AxiosResponse,
}

interface Data_ContentError {
    readonly request: IAnnealRequest,
    content: AxiosError,
}

interface Data_ContentUndefined {
    readonly request: IAnnealRequest,
    content: undefined,
}

export type AxiosResponse = AxiosResponse;
export type AxiosError = AxiosError;

export namespace AnnealResponse {
    export function Init(
        request: IAnnealRequest,
    ) {
        const annealResponseObject: Data = {
            request,
            content: undefined,
        };

        return annealResponseObject;
    }

    export function RequestMatchesResponse(annealRequest: IAnnealRequest, annealResponse: Data) {
        return annealResponse.request === annealRequest;
    }

    export function IsResponseReceived(annealResponse: Data) {
        return annealResponse.content !== undefined;
    }

    export function IsSuccessful(annealResponse: Data): annealResponse is Data_ContentSuccess {
        const responseContent = annealResponse.content;

        // Not yet received response, or unknown request
        if (responseContent === undefined) {
            return false;
        }

        // If the "response" is an Error/AxiosError object
        if (responseContent instanceof Error) {
            return false;
        }

        // Otherwise okay
        return true;
    }
}
