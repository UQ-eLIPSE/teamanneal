import * as Record from "./Record";
import * as ToServerAnnealRequest from "./ToServerAnnealRequest";

export interface ToServerSatisfactionTestPermutationRequest extends ToServerAnnealRequest.Root {
    operation: MoveRecordTestPermutationOperationInfo | SwapRecordsTestPermutationOperationInfo,
}

export interface MoveRecordSatisfactionTestPermutationRequest extends ToServerAnnealRequest.Root {
    operation: MoveRecordTestPermutationOperationInfo,
}

export interface SwapRecordsSatisfactionTestPermutationRequest extends ToServerAnnealRequest.Root {
    operation: SwapRecordsTestPermutationOperationInfo,
}

export interface MoveRecordTestPermutationOperationInfo {
    fromNode: string,
    recordId: Record.RecordElement,
}

export interface SwapRecordsTestPermutationOperationInfo {
    nodeA: string,
    recordIdA: Record.RecordElement,
}
