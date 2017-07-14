import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";

export interface AnnealJobData {
    annealRequest: ToServerAnnealRequest.Root,
    serverResponseId: number,
}

export interface AnnealResultMessageData {
    result?: any,
    error?: any,
    serverResponseId: number,
}
