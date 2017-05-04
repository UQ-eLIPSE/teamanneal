import * as Record from "../../../common/Record";

export type TestFunction = (targetValue: Record.RecordElement, recordValue: Record.RecordElement) => boolean;

export const eq: TestFunction = (targetValue, recordValue) => recordValue === targetValue;
export const neq: TestFunction = (targetValue, recordValue) => recordValue !== targetValue;
export const lt: TestFunction = (targetValue, recordValue) => (recordValue || 0) < (targetValue || 0);
export const gt: TestFunction = (targetValue, recordValue) => (recordValue || 0) > (targetValue || 0);
export const lte: TestFunction = (targetValue, recordValue) => (recordValue || 0) <= (targetValue || 0);
export const gte: TestFunction = (targetValue, recordValue) => (recordValue || 0) >= (targetValue || 0);
