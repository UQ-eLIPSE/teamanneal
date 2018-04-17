import { MutationTree, ActionContext, CommitOptions } from "vuex";
import { set, del } from "../../util/Vue";

import { AnnealCreatorState } from "./state";

import { Data as Constraint } from "../../data/Constraint";
import { Stratum } from "../../data/Stratum";
import { RecordData, init as initRecordData } from "../../data/RecordData";
import { init as initStrataConfig } from "../../data/StrataConfig";
import { init as initConstraintConfig } from "../../data/ConstraintConfig";
import { FunctionParam2 } from "../../data/FunctionParam2";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";

type MutationFunction<M extends AnnealCreatorMutation> = typeof mutations[M];

type Context = ActionContext<AnnealCreatorState, AnnealCreatorState>;

export enum AnnealCreatorMutation {
    SET_RECORD_DATA = "Setting record data",
    CLEAR_RECORD_DATA = "Clearing record data",

    INSERT_CONSTRAINT = "Inserting a constraint",
    SET_CONSTRAINT = "Setting a constraint",
    DELETE_CONSTRAINT = "Deleting a constraint",
    CLEAR_CONSTRAINTS = "Clearing constraints",

    INSERT_STRATUM = "Inserting stratum",
    SET_STRATUM = "Setting stratum",
    DELETE_STRATUM = "Deleting stratum",
    CLEAR_STRATA = "Clearing strata",

    INSERT_RECORD_COLUMN_DATA = "Inserting record column data",
    SET_RECORD_COLUMN_DATA = "Setting record column data",
    DELETE_RECORD_COLUMN_DATA = "Deleting record column data",
    CLEAR_RECORD_COLUMN_DATA = "Clearing record column data",

    SET_RECORD_ID_COLUMN = "Setting record ID column",
    CLEAR_RECORD_ID_COLUMN = "Clearing record ID column",

    SET_RECORD_PARTITION_COLUMN = "Setting record partition column",
    CLEAR_RECORD_PARTITION_COLUMN = "Clearing record partition column",
}

/** Shorthand for Mutation enum above */
const M = AnnealCreatorMutation;

/** Type-safe commit function */
export function commit<M extends AnnealCreatorMutation, F extends MutationFunction<M>>(context: Context, mutation: M, payload: FunctionParam2<F>, options?: CommitOptions): void {
    return context.commit(mutation, payload, options);
}

/** Store mutation functions */
const mutations = {
    [M.SET_RECORD_DATA](state: AnnealCreatorState, recordData: RecordData) {
        set(state, "recordData", recordData);
    },

    [M.CLEAR_RECORD_DATA](state: AnnealCreatorState) {
        set(state, "recordData", initRecordData());
    },

    [M.INSERT_CONSTRAINT](state: AnnealCreatorState, constraint: Constraint) {
        state.constraintConfig.constraints.push(constraint);
    },

    [M.SET_CONSTRAINT](state: AnnealCreatorState, { constraint, index }: { constraint: Constraint, index: number }) {
        set(state.constraintConfig.constraints, index, constraint);
    },

    [M.DELETE_CONSTRAINT](state: AnnealCreatorState, index: number) {
        del(state.constraintConfig.constraints, index);
    },

    [M.CLEAR_CONSTRAINTS](state: AnnealCreatorState) {
        set(state, "constraintConfig", initConstraintConfig());
    },

    [M.INSERT_STRATUM](state: AnnealCreatorState, stratum: Stratum) {
        state.strataConfig.strata.push(stratum);
    },

    [M.SET_STRATUM](state: AnnealCreatorState, { stratum, index }: { stratum: Stratum, index: number }) {
        set(state.strataConfig.strata, index, stratum);
    },

    [M.DELETE_STRATUM](state: AnnealCreatorState, index: number) {
        del(state.strataConfig.strata, index);
    },

    [M.CLEAR_STRATA](state: AnnealCreatorState) {
        set(state, "strataConfig", initStrataConfig());
    },

    [M.INSERT_RECORD_COLUMN_DATA](state: AnnealCreatorState, column: IColumnData) {
        state.recordData.columns.push(column);
    },

    [M.SET_RECORD_COLUMN_DATA](state: AnnealCreatorState, { column, index }: { column: IColumnData, index: number }) {
        set(state.recordData.columns, index, column);
    },

    [M.DELETE_RECORD_COLUMN_DATA](state: AnnealCreatorState, index: number) {
        del(state.recordData.columns, index);
    },

    [M.CLEAR_RECORD_COLUMN_DATA](state: AnnealCreatorState) {
        set(state.recordData, "columns", []);
    },

    [M.SET_RECORD_ID_COLUMN](state: AnnealCreatorState, idColumn: IColumnData_MinimalDescriptor) {
        const minimalDescriptor = ColumnData.ConvertToMinimalDescriptor(idColumn);
        set(state.recordData, "idColumn", minimalDescriptor);
    },

    [M.CLEAR_RECORD_ID_COLUMN](state: AnnealCreatorState) {
        set(state.recordData, "idColumn", undefined);
    },

    [M.SET_RECORD_PARTITION_COLUMN](state: AnnealCreatorState, partitionColumn: IColumnData_MinimalDescriptor) {
        const minimalDescriptor = ColumnData.ConvertToMinimalDescriptor(partitionColumn);
        set(state.recordData, "partitionColumn", minimalDescriptor);
    },

    [M.CLEAR_RECORD_PARTITION_COLUMN](state: AnnealCreatorState) {
        set(state.recordData, "partitionColumn", undefined);
    },
};

export function init() {
    return mutations as MutationTree<AnnealCreatorState>;
}
