import { ActionTree, ActionContext, DispatchOptions, Store } from "vuex";

import { ResultsEditorState } from "./ResultsEditorState";
import { ResultsEditorMutation as M, commit } from "./ResultsEditorMutation";

import { RecordData } from "../data/RecordData";
import { GroupNode } from "../data/GroupNode";
import { GroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeStructure } from "../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";
import { DataWithoutNamingConfig as Stratum } from "../data/Stratum";

import { RecordElement } from "../../../common/Record";

type ActionFunction<A extends ResultsEditorAction> = typeof actions[A];

type FunctionParam2<T> =
    T extends (x: any, y: undefined, ...args: any[]) => any ? undefined :
    T extends (x: any, y: infer U, ...args: any[]) => any ? U : never;

type Context = ActionContext<ResultsEditorState, ResultsEditorState>;

export enum ResultsEditorAction {
    // TODO: [WIP] Hydration/dehydration test actions
    __HYDRATE = "__HYDRATE",
    __DEHYDRATE = "__DEHYDRATE",

    RESET_STATE = "Resetting state",

    SET_RECORD_DATA = "Setting record data",

    SET_STRATA = "Setting strata",

    SET_GROUP_NODE_STRUCTURE = "Setting group node structure",

    SET_GROUP_NODE_NAME_MAP = "Setting group node name map",

    SET_GROUP_NODE_RECORD_ARRAY_MAP = "Setting group node record array map",

    SET_SIDE_PANEL_ACTIVE_TOOL_BY_NAME = "Setting side panel active tool by name",
    CLEAR_SIDE_PANEL_ACTIVE_TOOL = "Clearing side panel active tool",

    MOVE_RECORD_TO_GROUP_NODE = "Moving record to group node",

    SWAP_RECORDS = "Swapping records",
}

/** Shorthand for Action enum above */
const A = ResultsEditorAction;

/** Type-safe dispatch function factory */
export function dispatchFactory<T>(store: Store<T>, modulePrefix?: string) {
    return function dispatch<A extends ResultsEditorAction, F extends ActionFunction<A>>(action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
        let _action: string = action;

        if (modulePrefix !== undefined) {
            _action = `${modulePrefix}/${_action}`;
        }

        return store.dispatch(_action, payload, options) as ReturnType<F>;
    }
}

/** Internal dispatch function */
function dispatch<A extends ResultsEditorAction, F extends ActionFunction<A>>(context: Context, action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
    return context.dispatch(action, payload, options) as ReturnType<F>;
}

/** Store action functions */
const actions = {
    // TODO: [WIP]
    async [A.__HYDRATE](context: Context, dehydratedState: string) {
        const state = JSON.parse(dehydratedState) as ResultsEditorState;

        await dispatch(context, A.SET_RECORD_DATA, state.recordData);
        await dispatch(context, A.SET_STRATA, state.strataConfig.strata);
        await dispatch(context, A.SET_GROUP_NODE_STRUCTURE, state.groupNode.structure);
        await dispatch(context, A.SET_GROUP_NODE_NAME_MAP, state.groupNode.nameMap);
        await dispatch(context, A.SET_GROUP_NODE_RECORD_ARRAY_MAP, state.groupNode.nodeRecordArrayMap);
    },
    
    // TODO: [WIP]
    async [A.__DEHYDRATE](context: Context) {
        return JSON.stringify(context.state);
    },

    async [A.RESET_STATE](context: Context) {
        commit(context, M.CLEAR_RECORD_DATA, undefined);
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
        commit(context, M.CLEAR_GROUP_NODE_STRUCTURE, undefined);
        commit(context, M.CLEAR_GROUP_NODE_NAME_MAP, undefined);
        commit(context, M.CLEAR_GROUP_NODE_RECORD_ARRAY_MAP, undefined);
    },

    async [A.SET_RECORD_DATA](context: Context, recordData: RecordData) {
        commit(context, M.SET_RECORD_DATA, recordData);
    },

    async [A.SET_STRATA](context: Context, strata: Stratum[]) {
        // Clear all strata, then iterate through array and insert
        commit(context, M.CLEAR_STRATA, undefined);
        strata.forEach(s => commit(context, M.INSERT_STRATUM, s));
    },

    async [A.SET_GROUP_NODE_STRUCTURE](context: Context, structure: GroupNodeStructure) {
        commit(context, M.SET_GROUP_NODE_STRUCTURE, structure);
    },

    async [A.SET_GROUP_NODE_NAME_MAP](context: Context, nameMap: GroupNodeNameMap) {
        commit(context, M.SET_GROUP_NODE_NAME_MAP, nameMap);
    },

    async [A.SET_GROUP_NODE_RECORD_ARRAY_MAP](context: Context, nodeRecordArrayMap: GroupNodeRecordArrayMap) {
        commit(context, M.SET_GROUP_NODE_RECORD_ARRAY_MAP, nodeRecordArrayMap);
    },

    async [A.SET_SIDE_PANEL_ACTIVE_TOOL_BY_NAME](context: Context, name: string) {
        commit(context, M.SET_SIDE_PANEL_ACTIVE_TOOL, { name });
    },

    async [A.CLEAR_SIDE_PANEL_ACTIVE_TOOL](context: Context) {
        commit(context, M.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
    },

    async [A.MOVE_RECORD_TO_GROUP_NODE](context: Context, { sourcePerson, targetGroup }: { sourcePerson: { node: GroupNode, id: RecordElement }, targetGroup: GroupNode }) {
        commit(context, M.DELETE_RECORD_ID_FROM_GROUP_NODE, { node: sourcePerson.node, id: sourcePerson.id });
        commit(context, M.INSERT_RECORD_ID_TO_GROUP_NODE, { node: targetGroup, id: sourcePerson.id });
    },

    async [A.SWAP_RECORDS](context: Context, { personA, personB }: { personA: { node: GroupNode, id: RecordElement }, personB: { node: GroupNode, id: RecordElement } }) {
        // Only permit unique IDs to be swapped
        if (personA.id === personB.id) {
            throw new Error("Only two unique records can be swapped");
        }

        commit(context, M.DELETE_RECORD_ID_FROM_GROUP_NODE, { node: personA.node, id: personA.id });
        commit(context, M.DELETE_RECORD_ID_FROM_GROUP_NODE, { node: personB.node, id: personB.id });

        commit(context, M.INSERT_RECORD_ID_TO_GROUP_NODE, { node: personB.node, id: personA.id });
        commit(context, M.INSERT_RECORD_ID_TO_GROUP_NODE, { node: personA.node, id: personB.id });
    },
};

export function init() {
    return actions as ActionTree<ResultsEditorState, ResultsEditorState>;
}
