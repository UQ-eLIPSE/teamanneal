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

    SET_SIDE_PANEL_ACTIVE_TOOL = "Setting side panel active tool",
    CLEAR_SIDE_PANEL_ACTIVE_TOOL = "Clearing side panel active tool",
}

/** Shorthand for Mutation enum above */
const M = ResultsEditorMutation;

/** Type-safe commit function */
export function commit<M extends ResultsEditorMutation, F extends MutationFunction<M>>(context: Context, mutation: M, payload: FunctionParam2<F>, options?: CommitOptions): void {
    return context.commit(mutation, payload, options);
}

/** Store mutation functions */
const mutations = {
    [M.SET_RECORD_DATA](state: ResultsEditorState, recordData: RecordData) {
        set(state, "recordData", recordData);
    },

    [M.CLEAR_RECORD_DATA](state: ResultsEditorState) {
        set(state, "recordData", initRecordData());
    },

    [M.INSERT_CONSTRAINT](state: ResultsEditorState, constraint: Constraint) {
        state.constraintConfig.constraints.push(constraint);
    },

    [M.SET_CONSTRAINT](state: ResultsEditorState, { constraint, index }: { constraint: Constraint, index: number }) {
        set(state.constraintConfig.constraints, index, constraint);
    },

    [M.DELETE_CONSTRAINT](state: ResultsEditorState, index: number) {
        del(state.constraintConfig.constraints, index);
    },

    [M.CLEAR_CONSTRAINTS](state: ResultsEditorState) {
        set(state, "constraintConfig", initConstraintConfig());
    },

    [M.INSERT_STRATUM](state: ResultsEditorState, stratum: Stratum) {
        state.strataConfig.strata.push(stratum);
    },

    [M.SET_STRATUM](state: ResultsEditorState, { stratum, index }: { stratum: Stratum, index: number }) {
        set(state.strataConfig.strata, index, stratum);
    },

    [M.DELETE_STRATUM](state: ResultsEditorState, index: number) {
        del(state.strataConfig.strata, index);
    },

    [M.CLEAR_STRATA](state: ResultsEditorState) {
        set(state, "strataConfig", initStrataConfig());
    },

    [M.SET_GROUP_NODE_STRUCTURE](state: ResultsEditorState, structure: GroupNodeStructure) {
        set(state.groupNode, "structure", structure);
    },

    [M.CLEAR_GROUP_NODE_STRUCTURE](state: ResultsEditorState) {
        set(state.groupNode, "structure", initGroupNodeStructure());
    },

    [M.SET_GROUP_NODE_NAME_MAP](state: ResultsEditorState, nameMap: GroupNodeNameMap) {
        set(state.groupNode, "nameMap", nameMap);
    },

    [M.CLEAR_GROUP_NODE_NAME_MAP](state: ResultsEditorState) {
        set(state.groupNode, "nameMap", initGroupNodeNameMap());
    },

    [M.SET_GROUP_NODE_RECORD_ARRAY_MAP](state: ResultsEditorState, nodeRecordArrayMap: GroupNodeRecordArrayMap) {
        set(state.groupNode, "nodeRecordArrayMap", nodeRecordArrayMap);
    },

    [M.CLEAR_GROUP_NODE_RECORD_ARRAY_MAP](state: ResultsEditorState) {
        set(state.groupNode, "nodeRecordArrayMap", initGroupNodeRecordArrayMap());
    },

    [M.SET_SIDE_PANEL_ACTIVE_TOOL](state: ResultsEditorState, { name, data }: { name: string, data?: object }) {
        set(state.sideToolArea, "activeItem", { name, data: data || {}, });
    },

    [M.CLEAR_SIDE_PANEL_ACTIVE_TOOL](state: ResultsEditorState) {
        set(state.sideToolArea, "activeItem", undefined);
    },
};

export function init() {
    return mutations as MutationTree<ResultsEditorState>;
}
