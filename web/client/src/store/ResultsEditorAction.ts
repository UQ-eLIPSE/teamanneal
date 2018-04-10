import { ActionTree, ActionContext, DispatchOptions, Store } from "vuex";

import { ResultsEditorState } from "./ResultsEditorState";
import { ResultsEditorMutation as M, commit } from "./ResultsEditorMutation";

import { RecordData } from "../data/RecordData";
import { GroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeStructure } from "../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";
import { DataWithoutNamingConfig as Stratum } from "../data/Stratum";

type ActionFunction<A extends ResultsEditorAction> = typeof actions[A];

type FunctionParam2<T> =
    T extends (x: any, y: undefined, ...args: any[]) => any ? undefined :
    T extends (x: any, y: infer U, ...args: any[]) => any ? U : never;

type Context = ActionContext<ResultsEditorState, ResultsEditorState>;

export enum ResultsEditorAction {
    RESET_STATE = "Resetting state",

    SET_RECORD_DATA = "Setting record data",

    SET_STRATA = "Setting strata",

    SET_GROUP_NODE_STRUCTURE = "Setting group node structure",

    SET_GROUP_NODE_NAME_MAP = "Setting group node name map",

    SET_GROUP_NODE_RECORD_ARRAY_MAP = "Setting group node record array map",
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

/** Store action functions */
const actions = {
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
};

export function init() {
    return actions as ActionTree<ResultsEditorState, ResultsEditorState>;
}
