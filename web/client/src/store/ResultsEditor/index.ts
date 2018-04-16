import { Module } from "vuex";
import { ResultsEditorState, init as initState } from "./state";
import { init as initMutations } from "./mutation";
import { init as initActions } from "./action";

export function init(namespaced: boolean = true) {
    const stateModule: Module<ResultsEditorState, ResultsEditorState> = {
        namespaced,

        // We provide an init function so that a new object will be instantiated
        // with each module generated
        state: initState,

        mutations: initMutations(),

        actions: initActions(),
    };

    return stateModule;
}

export { ResultsEditorState as State } from "./state";
export { ResultsEditorAction as Action, dispatchFactory } from "./action";
