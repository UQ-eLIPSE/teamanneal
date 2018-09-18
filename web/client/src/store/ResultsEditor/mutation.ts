import { MutationTree, ActionContext, CommitOptions } from "vuex";
import { set, del } from "../../util/Vue";

import { ResultsEditorState as State } from "./state";

import { Data as Constraint } from "../../data/Constraint";
import { Stratum } from "../../data/Stratum";
import { RecordData, init as initRecordData } from "../../data/RecordData";
import { init as initStrataConfig } from "../../data/StrataConfig";
import { init as initConstraintConfig } from "../../data/ConstraintConfig";
import { GroupNodeNameMap, init as initGroupNodeNameMap } from "../../data/GroupNodeNameMap";
import { GroupNodeStructure, init as initGroupNodeStructure } from "../../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap, init as initGroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";
import { FunctionParam2 } from "../../data/FunctionParam2";

import { RecordElement } from "../../../../common/Record";
import { SidePanelActiveTool } from "../../data/SidePanelActiveTool";
import * as ConstraintSatisfaction from "../../../../common/ConstraintSatisfaction";

type MutationFunction<M extends ResultsEditorMutation> = typeof mutations[M];

type Context = ActionContext<State, State>;

export enum ResultsEditorMutation {
    SHALLOW_MERGE_STATE = "Shallow merge state",

    SET_RECORD_DATA = "Setting record data",
    CLEAR_RECORD_DATA = "Clearing record data",

    INSERT_CONSTRAINT = "Inserting a constraint",
    SET_CONSTRAINT = "Setting a constraint",
    DELETE_CONSTRAINT = "Deleting a constraint",
    CLEAR_CONSTRAINTS = "Clearing constraints",

    INSERT_STRATUM = "Inserting stratum",
    INSERT_STRATA = "Inserting strata",
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

    SET_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA = "Setting side panel active tool internal data",

    INSERT_RECORD_ID_TO_GROUP_NODE = "Inserting a record ID to a group node",
    DELETE_RECORD_ID_FROM_GROUP_NODE = "Deleting a record ID from a group node",
    SET_SATISFACTION_DATA = "Setting satisfaction data",
    CLEAR_SATISFACTION_DATA = "Clearing satisfaction data"
}

/** Shorthand for Mutation enum above */
const M = ResultsEditorMutation;

/** Type-safe commit function */
export function commit<M extends ResultsEditorMutation, F extends MutationFunction<M>>(context: Context, mutation: M, payload: FunctionParam2<F>, options?: CommitOptions): void {
    return context.commit(mutation, payload, options);
}

/** Store mutation functions */
const mutations = {
    [M.SHALLOW_MERGE_STATE](state: State, newState: Partial<State>) {
        // TODO: Investigate types of `state` and `newState`
        // This might be resolved in TypeScript 2.9 with improved `keyof`
        for (let k in newState) {
            set((state as Record<string, any>), k, (newState as Record<string, any>)[k]);
        }
    },

    [M.SET_RECORD_DATA](state: State, recordData: RecordData) {
        set(state, "recordData", recordData);
    },

    [M.CLEAR_RECORD_DATA](state: State) {
        set(state, "recordData", initRecordData());
    },

    [M.INSERT_CONSTRAINT](state: State, constraint: Constraint) {
        state.constraintConfig.constraints.push(constraint);
    },
    [M.SET_SATISFACTION_DATA](state: State, satisfaction: { satisfactionMap: ConstraintSatisfaction.SatisfactionMap, statistics: { [nodeId: string]: ConstraintSatisfaction.MultipleSatisfactionStats }[] }) {
        set(state, "satisfaction", satisfaction);
    },
    [M.CLEAR_SATISFACTION_DATA](state: State) {
        set(state, "satisfaction", ConstraintSatisfaction.initConstraintSatisfactionState());
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

    [M.INSERT_STRATA](state: State, strata: ReadonlyArray<Stratum>) {
        strata.forEach(s => state.strataConfig.strata.push(s));
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

    [M.SET_GROUP_NODE_STRUCTURE](state: State, structure: GroupNodeStructure) {
        set(state.groupNode, "structure", structure);
    },

    [M.CLEAR_GROUP_NODE_STRUCTURE](state: State) {
        set(state.groupNode, "structure", initGroupNodeStructure());
    },

    [M.SET_GROUP_NODE_NAME_MAP](state: State, nameMap: GroupNodeNameMap) {
        set(state.groupNode, "nameMap", nameMap);
    },

    [M.CLEAR_GROUP_NODE_NAME_MAP](state: State) {
        set(state.groupNode, "nameMap", initGroupNodeNameMap());
    },

    [M.SET_GROUP_NODE_RECORD_ARRAY_MAP](state: State, nodeRecordArrayMap: GroupNodeRecordArrayMap) {
        set(state.groupNode, "nodeRecordArrayMap", nodeRecordArrayMap);
    },

    [M.CLEAR_GROUP_NODE_RECORD_ARRAY_MAP](state: State) {
        set(state.groupNode, "nodeRecordArrayMap", initGroupNodeRecordArrayMap());
    },

    [M.SET_SIDE_PANEL_ACTIVE_TOOL](state: State, data: SidePanelActiveTool) {
        set(state.sideToolArea, "activeItem", data);
    },

    [M.CLEAR_SIDE_PANEL_ACTIVE_TOOL](state: State) {
        set(state.sideToolArea, "activeItem", undefined);
    },

    [M.SET_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA](state: State, data: object) {
        if (state.sideToolArea.activeItem === undefined) {
            throw new Error("No side panel active tool object");
        }

        set(state.sideToolArea.activeItem, "data", data);
    },

    [M.INSERT_RECORD_ID_TO_GROUP_NODE](state: State, { node, id }: { node: string, id: RecordElement }) {
        state.groupNode.nodeRecordArrayMap[node].push(id);
    },

    [M.DELETE_RECORD_ID_FROM_GROUP_NODE](state: State, { node, id }: { node: string, id: RecordElement }) {
        const recordsUnderNode = state.groupNode.nodeRecordArrayMap[node];
        del(recordsUnderNode, recordsUnderNode.indexOf(id));
    },
};

export function init() {
    return mutations as MutationTree<State>;
}
