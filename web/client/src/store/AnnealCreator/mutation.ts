import { MutationTree, ActionContext, CommitOptions } from "vuex";
import { set, del } from "../../util/Vue";

import { AnnealCreatorState } from "./state";

import { Data as Constraint } from "../../data/Constraint";
import { Stratum } from "../../data/Stratum";
import { RecordData, initNew as initRecordData } from "../../data/RecordData";
import { initNew as initStrataConfig } from "../../data/StrataConfig";
import { initNew as initConstraintConfig } from "../../data/ConstraintConfig";
import { GroupNode } from "../../data/GroupNode";
import { GroupNodeNameMap, initNew as initGroupNodeNameMap } from "../../data/GroupNodeNameMap";
import { GroupNodeStructure, initNew as initGroupNodeStructure } from "../../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap, initNew as initGroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";
import { FunctionParam2 } from "../../data/FunctionParam2";

import { RecordElement } from "../../../../common/Record";
import { SidePanelActiveTool } from "../../data/SidePanelActiveTool";

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

    SET_GROUP_NODE_STRUCTURE = "Setting group node structure",
    CLEAR_GROUP_NODE_STRUCTURE = "Clearing group node structure",

    SET_GROUP_NODE_NAME_MAP = "Setting group node name map",
    CLEAR_GROUP_NODE_NAME_MAP = "Clearing group node name map",

    SET_GROUP_NODE_RECORD_ARRAY_MAP = "Setting group node record array map",
    CLEAR_GROUP_NODE_RECORD_ARRAY_MAP = "Clearing group node record array map",

    SET_SIDE_PANEL_ACTIVE_TOOL = "Setting side panel active tool",
    CLEAR_SIDE_PANEL_ACTIVE_TOOL = "Clearing side panel active tool",

    INSERT_RECORD_ID_TO_GROUP_NODE = "Inserting a record ID to a group node",
    DELETE_RECORD_ID_FROM_GROUP_NODE = "Deleting a record ID from a group node",
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

    [M.SET_GROUP_NODE_STRUCTURE](state: AnnealCreatorState, structure: GroupNodeStructure) {
        set(state.groupNode, "structure", structure);
    },

    [M.CLEAR_GROUP_NODE_STRUCTURE](state: AnnealCreatorState) {
        set(state.groupNode, "structure", initGroupNodeStructure());
    },

    [M.SET_GROUP_NODE_NAME_MAP](state: AnnealCreatorState, nameMap: GroupNodeNameMap) {
        set(state.groupNode, "nameMap", nameMap);
    },

    [M.CLEAR_GROUP_NODE_NAME_MAP](state: AnnealCreatorState) {
        set(state.groupNode, "nameMap", initGroupNodeNameMap());
    },

    [M.SET_GROUP_NODE_RECORD_ARRAY_MAP](state: AnnealCreatorState, nodeRecordArrayMap: GroupNodeRecordArrayMap) {
        set(state.groupNode, "nodeRecordArrayMap", nodeRecordArrayMap);
    },

    [M.CLEAR_GROUP_NODE_RECORD_ARRAY_MAP](state: AnnealCreatorState) {
        set(state.groupNode, "nodeRecordArrayMap", initGroupNodeRecordArrayMap());
    },

    [M.SET_SIDE_PANEL_ACTIVE_TOOL](state: AnnealCreatorState, data: SidePanelActiveTool) {
        set(state.sideToolArea, "activeItem", data);
    },

    [M.CLEAR_SIDE_PANEL_ACTIVE_TOOL](state: AnnealCreatorState) {
        set(state.sideToolArea, "activeItem", undefined);
    },

    [M.INSERT_RECORD_ID_TO_GROUP_NODE](state: AnnealCreatorState, { node, id }: { node: GroupNode, id: RecordElement }) {
        state.groupNode.nodeRecordArrayMap[node._id].push(id);
    },

    [M.DELETE_RECORD_ID_FROM_GROUP_NODE](state: AnnealCreatorState, { node, id }: { node: GroupNode, id: RecordElement }) {
        const recordsUnderNode = state.groupNode.nodeRecordArrayMap[node._id];
        del(recordsUnderNode, recordsUnderNode.indexOf(id));
    },
};

export function init() {
    return mutations as MutationTree<AnnealCreatorState>;
}
