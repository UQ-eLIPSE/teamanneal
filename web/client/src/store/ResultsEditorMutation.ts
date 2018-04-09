import { MutationTree, ActionContext, CommitOptions } from "vuex";
import { set, del } from "../util/Vue";

import { ResultsEditorState } from "./ResultsEditorState";

import { Data as Constraint } from "../data/Constraint";
import { DataWithoutNamingConfig as Stratum } from "../data/Stratum";
import { RecordData, initNew as initRecordData } from "../data/RecordData";
import { initNew as initStrataConfig } from "../data/StrataConfig";
import { initNew as initConstraintConfig } from "../data/ConstraintConfig";
import { GroupNodeNameMap, initNew as initGroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeStructure, initNew as initGroupNodeStructure } from "../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap, initNew as initGroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";

type MutationFunction<M extends ResultsEditorMutation> = typeof mutations[M];

type FunctionParam2<T> =
    T extends (x: any, y: undefined) => any ? undefined :
    T extends (x: any, y: infer U) => any ? U : never;

type Context = ActionContext<ResultsEditorState, ResultsEditorState>;

export enum ResultsEditorMutation {
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

    SET_GROUP_NODE_STRUCTURE = "Setting group node structure",
    CLEAR_GROUP_NODE_STRUCTURE = "Clearing group node structure",

    SET_GROUP_NODE_NAME_MAP = "Setting group node name map",
    CLEAR_GROUP_NODE_NAME_MAP = "Clearing group node name map",

    SET_GROUP_NODE_RECORD_ARRAY_MAP = "Setting group node record array map",
    CLEAR_GROUP_NODE_RECORD_ARRAY_MAP = "Clearing group node record array map",
}

/** Shorthand for Mutation enum above */
const M = ResultsEditorMutation;

/** Type-safe commit function */
export function commit<M extends ResultsEditorMutation, F extends MutationFunction<M>>(context: Context, mutation: M, payload: FunctionParam2<F>, options?: CommitOptions): void {
    return context.commit(mutation, payload, options);
}

/** Store mutation functions */
const mutations: MutationTree<ResultsEditorState> = {
    [M.SET_RECORD_DATA](state, recordData: RecordData) {
        set(state, "recordData", recordData);
    },

    [M.CLEAR_RECORD_DATA](state) {
        set(state, "recordData", initRecordData());
    },

    [M.INSERT_CONSTRAINT](state, constraint: Constraint) {
        state.constraintConfig.constraints.push(constraint);
    },

    [M.SET_CONSTRAINT](state, { constraint, index }: { constraint: Constraint, index: number }) {
        set(state.constraintConfig.constraints, index, constraint);
    },

    [M.DELETE_CONSTRAINT](state, index: number) {
        del(state.constraintConfig.constraints, index);
    },

    [M.CLEAR_CONSTRAINTS](state) {
        set(state, "constraintConfig", initConstraintConfig());
    },

    [M.INSERT_STRATUM](state, stratum: Stratum) {
        state.strataConfig.strata.push(stratum);
    },

    [M.SET_STRATUM](state, { stratum, index }: { stratum: Stratum, index: number }) {
        set(state.strataConfig.strata, index, stratum);
    },

    [M.DELETE_STRATUM](state, index: number) {
        del(state.strataConfig.strata, index);
    },

    [M.CLEAR_STRATA](state) {
        set(state, "strataConfig", initStrataConfig());
    },

    [M.SET_GROUP_NODE_STRUCTURE](state, structure: GroupNodeStructure) {
        set(state.groupNode, "structure", structure);
    },

    [M.CLEAR_GROUP_NODE_STRUCTURE](state) {
        set(state.groupNode, "structure", initGroupNodeStructure());
    },

    [M.SET_GROUP_NODE_NAME_MAP](state, nameMap: GroupNodeNameMap) {
        set(state.groupNode, "nameMap", nameMap);
    },

    [M.CLEAR_GROUP_NODE_NAME_MAP](state) {
        set(state.groupNode, "nameMap", initGroupNodeNameMap());
    },

    [M.SET_GROUP_NODE_RECORD_ARRAY_MAP](state, nodeRecordArrayMap: GroupNodeRecordArrayMap) {
        set(state.groupNode, "nodeRecordArrayMap", nodeRecordArrayMap);
    },

    [M.CLEAR_GROUP_NODE_RECORD_ARRAY_MAP](state) {
        set(state.groupNode, "nodeRecordArrayMap", initGroupNodeRecordArrayMap());
    },
};

export function init() {
    return mutations;
}
