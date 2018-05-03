import * as Record from "./Record";

export type ToClientSatisfactionTestPermutationResponse =
    MoveRecordTestPermutationOperationResult |
    SwapRecordsTestPermutationOperationResult;

export type MoveRecordTestPermutationOperationResult = { toNode: string, satisfaction: { value: number, max: number } }[];
export type SwapRecordsTestPermutationOperationResult = { nodeB: string, recordIdB: Record.RecordElement, satisfaction: { value: number, max: number } }[];
