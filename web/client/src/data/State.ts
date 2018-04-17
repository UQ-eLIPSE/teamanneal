import { Stratum } from "./Stratum";
import { Partition } from "./Partition";
import { RecordData } from "./RecordData";
import { AnnealConfig } from "./AnnealConfig";
import { Data as IAnnealRequest } from "./AnnealRequest";
import { AnnealResponse, Data as IAnnealResponse } from "./AnnealResponse";

export interface Data {
    /** Record data */
    recordData: RecordData,

    /** Configuration of the anneal request */
    annealConfig: AnnealConfig,

    /** Information about request to the annealing server */
    annealRequest: IAnnealRequest | undefined,

    /** Information about response from the annealing server */
    annealResponse: IAnnealResponse | undefined,
}

export namespace State {
    export function IsAnnealRequestInProgress({ annealRequest, annealResponse }: Data) {
        return (
            annealRequest !== undefined &&
            (
                annealResponse === undefined ||     // No response object set up yet
                (
                    // Check if request object matches and if we have NOT yet
                    // received a response
                    AnnealResponse.RequestMatchesResponse(annealRequest, annealResponse) &&
                    !AnnealResponse.IsResponseReceived(annealResponse)
                )
            )
        );
    }

    export function IsAnnealRequestCreated({ annealRequest }: Data) {
        return annealRequest !== undefined;
    }

    export function IsAnnealRequestSuccessful({ annealRequest, annealResponse }: Data) {
        return (
            annealRequest !== undefined &&
            annealResponse !== undefined &&
            AnnealResponse.RequestMatchesResponse(annealRequest, annealResponse) &&
            AnnealResponse.IsSuccessful(annealResponse)
        );
    }
}

