import { ActionTree, ActionContext, DispatchOptions, Store } from "vuex";

import { ResultsEditorState } from "./ResultsEditorState";
import { ResultsEditorMutation as M, commit } from "./ResultsEditorMutation";

type ActionFunction<A extends ResultsEditorAction> = typeof actions[A];

type FunctionParam2<T> =
    T extends (x: any, y: undefined) => any ? undefined :
    T extends (x: any, y: infer U) => any ? U : never;

type Context = ActionContext<ResultsEditorState, ResultsEditorState>;

export enum ResultsEditorAction {
    RESET_STATE = "Resetting state",

    DO_SOMETHING_ELSE = "Do something else",
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

    async [A.DO_SOMETHING_ELSE](_context: Context, _string: string) {
    },
};

export function init() {
    return actions as ActionTree<ResultsEditorState, ResultsEditorState>;
}
