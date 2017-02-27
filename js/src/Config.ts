import * as SourceRecord from "./SourceRecord";

export interface Root {
    readonly "tool-version": string,
    readonly identifier: string,
    readonly partition: string | null,
    readonly levels: ReadonlyArray<Level>,
    readonly "name-format": NameFormat,
    readonly constraints: ReadonlyArray<Constraint>,
}

export interface Level {
    readonly field: string,
    readonly size: LevelSize,
    readonly format: LevelFormat,
}

export interface LevelSize {
    readonly min: number,
    readonly ideal: number,
    readonly max: number,
}

export type LevelFormat =
    LevelFormatNumerical |
    LevelFormatCharacter |
    LevelFormatList;

export interface LevelFormatNumerical {
    readonly type: "numerical-0" | "numerical-1",
    readonly "leading-0": boolean,
}

export interface LevelFormatCharacter {
    readonly type: "character-upper" | "character-lower",
}

export interface LevelFormatList {
    readonly type: "list",
    readonly values: ReadonlyArray<string>,      // Team names must be strings
}

export interface NameFormat {
    readonly field: string,
    readonly format: string,
}

export type Constraint =
    ConstraintCountableThreshold |
    ConstraintCountableLimit |
    ConstraintSimilarity;

export interface ConstraintBase {
    readonly level: number,
    readonly weight: ConstraintWeight,
    readonly field: string,

    readonly "of-size"?: number,
}

export interface ConstraintCountable extends ConstraintBase {
    readonly "field-operator": ConstraintCountableFieldOperator,
    readonly "field-value": SourceRecord.Value,
}

export interface ConstraintCountableThreshold extends ConstraintCountable {
    readonly operator: ConstraintCountableThresholdOperator,
    readonly count: number,
}

export interface ConstraintCountableLimit extends ConstraintCountable {
    readonly operator: ConstraintCountableLimitOperator,
}

export interface ConstraintSimilarity extends ConstraintBase {
    readonly operator: ConstraintSimilarityOperator,
}

export type ConstraintCountableThresholdOperator =
    "exactly" |
    "not exactly" |
    "at least" |
    "at most";

export type ConstraintCountableLimitOperator =
    "as many as possible" | 
    "as few as possible";

export type ConstraintSimilarityOperator =
    "as similar as possible" | 
    "as different as possible";

export type ConstraintWeight =
    "must have" |
    "should have" |
    "ideally has" |
    "could have";

export type ConstraintCountableFieldOperator =
    "equal to" |
    "not equal to" |
    "less than or equal to" |
    "less than" |
    "greater than or equal to" |
    "greater than";
