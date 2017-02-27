import * as Config from "./Config";
import * as SourceRecord from "./SourceRecord";

import * as ColumnInfo from "./ColumnInfo";
import * as Util from "./Util";


export interface Constraint<T extends Config.ConstraintBase> {
    readonly description: T,
    readonly columnInfo: ColumnInfo.ColumnInfo,
}


export const wrapConstraint =
    (sourceRecordSet: SourceRecord.Set) =>
        (constraint: Config.Constraint) => {
            const wrappedConstraint: Constraint<typeof constraint> = {
                description: constraint,
                columnInfo: ColumnInfo.generateColumnInfo(sourceRecordSet)(constraint.field)
            }

            return wrappedConstraint;
        }

export const wrapConstraints =
    (sourceRecordSet: SourceRecord.Set) =>
        (constraints: ReadonlyArray<Config.Constraint>) => {
            return Util.readonlyArray(constraints.map(
                wrapConstraint(sourceRecordSet)
            ));;
        }

export const isConstraintCountableThreshold =
    (constraint: Constraint<Config.Constraint>): constraint is Constraint<Config.ConstraintCountableThreshold> => {
        switch (constraint.description.operator) {
            case "exactly":
            case "not exactly":
            case "at least":
            case "at most":
                return true;
        }

        return false;
    }

export const isConstraintCountableLimit =
    (constraint: Constraint<Config.Constraint>): constraint is Constraint<Config.ConstraintCountableLimit> => {
        switch (constraint.description.operator) {
            case "as many as possible":
            case "as few as possible":
                return true;
        }

        return false;
    }

export const isConstraintSimilarity =
    (constraint: Constraint<Config.Constraint>): constraint is Constraint<Config.ConstraintSimilarity> => {
        switch (constraint.description.operator) {
            case "as similar as possible":
            case "as different as possible":
                return true;
        }

        return false;
    }