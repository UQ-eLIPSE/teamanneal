import { Module } from "vuex";
import { ResultsEditorState, init as initState } from "./ResultsEditorState";
import { init as initMutations } from "./ResultsEditorMutation";
import { init as initActions } from "./ResultsEditorAction";
import { getters } from "./ResultsEditorGetter";

export function init(namespaced: boolean = true) {
    const stateModule: Module<ResultsEditorState, ResultsEditorState> = {
        namespaced,

        // We provide an init function so that a new object will be instantiated
        // with each module generated
        state: initState,

        mutations: initMutations(),
        
        actions: initActions(),

        getters: getters
    };

    return stateModule;
}

export { ResultsEditorState as State } from "./ResultsEditorState";
export { ResultsEditorAction as Action, dispatchFactory } from "./ResultsEditorAction";
export { getters } from "./ResultsEditorGetter";