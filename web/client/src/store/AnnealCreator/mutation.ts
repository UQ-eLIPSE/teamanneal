import { MutationTree, ActionContext, CommitOptions } from "vuex";
import { set, del } from "../../util/Vue";

import { AnnealCreatorState as State } from "./state";

import { Data as Constraint } from "../../data/Constraint";
import { Stratum } from "../../data/Stratum";
import { RecordData, init as initRecordData } from "../../data/RecordData";
import { init as initStrataConfig } from "../../data/StrataConfig";
import { init as initConstraintConfig } from "../../data/ConstraintConfig";
import { FunctionParam2 } from "../../data/FunctionParam2";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";
import { StratumNamingConfigContext } from "../../data/StratumNamingConfigContext";
import { StratumNamingConfig, getStratumNamingConfig } from "../../data/StratumNamingConfig";
import { ListCounterType } from "../../data/ListCounter";
import { AnnealRequestState } from "../../data/AnnealRequestState";

type MutationFunction<M extends AnnealCreatorMutation> = typeof mutations[M];

type Context = ActionContext<State, State>;

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

    INIT_STRATA_NAMING_CONFIG = "Initialising strata naming config",

    SET_STRATUM_NAMING_CONFIG = "Setting stratum's naming config",
    SET_STRATUM_NAMING_CONFIG_CONTEXT = "Setting stratum's naming config context",
    SET_STRATUM_NAMING_CONFIG_COUNTER = "Setting stratum's naming config counter",

    INSERT_RECORD_COLUMN_DATA = "Inserting record column data",
    SET_RECORD_COLUMN_DATA = "Setting record column data",
    DELETE_RECORD_COLUMN_DATA = "Deleting record column data",
    CLEAR_RECORD_COLUMN_DATA = "Clearing record column data",

    SET_RECORD_ID_COLUMN = "Setting record ID column",
    CLEAR_RECORD_ID_COLUMN = "Clearing record ID column",

    SET_RECORD_PARTITION_COLUMN = "Setting record partition column",
    CLEAR_RECORD_PARTITION_COLUMN = "Clearing record partition column",

    SET_NODE_NAMING_COMBINED_NAME_FORMAT = "Setting node naming combined name format",
    CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT = "Clearing node naming combined name format",

    SET_NODE_NAMING_COMBINED_NAME_USER_PROVIDED_FLAG = "Setting node naming combined name's user provided flag",

    SET_ANNEAL_REQUEST_STATE_OBJECT = "Setting anneal request state object",
}

/** Shorthand for Mutation enum above */
const M = AnnealCreatorMutation;

/** Type-safe commit function */
export function commit<M extends AnnealCreatorMutation, F extends MutationFunction<M>>(context: Context, mutation: M, payload: FunctionParam2<F>, options?: CommitOptions): void {
    return context.commit(mutation, payload, options);
}

/** Store mutation functions */
const mutations = {
    [M.SET_RECORD_DATA](state: State, recordData: RecordData) {
        set(state, "recordData", recordData);
    },

    [M.CLEAR_RECORD_DATA](state: State) {
        set(state, "recordData", initRecordData());
    },

    [M.INSERT_CONSTRAINT](state: State, constraint: Constraint) {
        state.constraintConfig.constraints.push(constraint);
    },

    [M.SET_CONSTRAINT](state: State, { constraint, index }: { constraint: Constraint, index: number }) {
        set(state.constraintConfig.constraints, index, constraint);
    },

    [M.DELETE_CONSTRAINT](state: State, index: number) {
        del(state.constraintConfig.constraints, index);
    },

    [M.CLEAR_CONSTRAINTS](state: State) {
        set(state, "constraintConfig", initConstraintConfig());
    },

    [M.INSERT_STRATUM](state: State, stratum: Stratum) {
        state.strataConfig.strata.push(stratum);
    },

    [M.SET_STRATUM](state: State, { stratum, index }: { stratum: Stratum, index: number }) {
        set(state.strataConfig.strata, index, stratum);
    },

    [M.DELETE_STRATUM](state: State, index: number) {
        del(state.strataConfig.strata, index);
    },

    [M.CLEAR_STRATA](state: State) {
        set(state, "strataConfig", initStrataConfig());
    },

    [M.INIT_STRATA_NAMING_CONFIG](state: State) {
        set(state.strataConfig, "namingConfig", {});
    },

    [M.SET_STRATUM_NAMING_CONFIG](state: State, { stratumId, namingConfig }: { stratumId: string, namingConfig: StratumNamingConfig }) {
        const namingConfigStore = state.strataConfig.namingConfig;

        if (namingConfigStore === undefined) {
            throw new Error("Stratum naming config object does not exist");
        }

        set(namingConfigStore, stratumId, namingConfig);
    },

    [M.SET_STRATUM_NAMING_CONFIG_CONTEXT](state: State, { stratumId, context }: { stratumId: string, context: StratumNamingConfigContext }) {
        const stratumNamingConfig = getStratumNamingConfig(state.strataConfig, stratumId);
        set(stratumNamingConfig, "context", context);
    },

    [M.SET_STRATUM_NAMING_CONFIG_COUNTER](state: State, { stratumId, counter }: { stratumId: string, counter: ListCounterType | string[] }) {
        const stratumNamingConfig = getStratumNamingConfig(state.strataConfig, stratumId);
        set(stratumNamingConfig, "counter", counter);
    },

    [M.INSERT_RECORD_COLUMN_DATA](state: State, column: IColumnData) {
        state.recordData.columns.push(column);
    },

    [M.SET_RECORD_COLUMN_DATA](state: State, { column, index }: { column: IColumnData, index: number }) {
        set(state.recordData.columns, index, column);
    },

    [M.DELETE_RECORD_COLUMN_DATA](state: State, index: number) {
        del(state.recordData.columns, index);
    },

    [M.CLEAR_RECORD_COLUMN_DATA](state: State) {
        set(state.recordData, "columns", []);
    },

    [M.SET_RECORD_ID_COLUMN](state: State, idColumn: IColumnData_MinimalDescriptor) {
        const minimalDescriptor = ColumnData.ConvertToMinimalDescriptor(idColumn);
        set(state.recordData, "idColumn", minimalDescriptor);
    },

    [M.CLEAR_RECORD_ID_COLUMN](state: State) {
        set(state.recordData, "idColumn", undefined);
    },

    [M.SET_RECORD_PARTITION_COLUMN](state: State, partitionColumn: IColumnData_MinimalDescriptor) {
        const minimalDescriptor = ColumnData.ConvertToMinimalDescriptor(partitionColumn);
        set(state.recordData, "partitionColumn", minimalDescriptor);
    },

    [M.CLEAR_RECORD_PARTITION_COLUMN](state: State) {
        set(state.recordData, "partitionColumn", undefined);
    },

    [M.SET_NODE_NAMING_COMBINED_NAME_FORMAT](state: State, nameFormat: string) {
        set(state.nodeNamingConfig.combined, "format", nameFormat);
    },

    [M.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT](state: State) {
        set(state.nodeNamingConfig.combined, "format", undefined);
    },

    [M.SET_NODE_NAMING_COMBINED_NAME_USER_PROVIDED_FLAG](state: State, userProvided: boolean) {
        set(state.nodeNamingConfig.combined, "userProvided", userProvided);
    },

    [M.SET_ANNEAL_REQUEST_STATE_OBJECT](state: State, annealRequestState: AnnealRequestState) {
        set(state, "annealRequest", annealRequestState);
    }
};

export function init() {
    return mutations as MutationTree<State>;
}
