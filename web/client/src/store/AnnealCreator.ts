import { Module } from "vuex";
import { AnnealCreatorState, init as initState } from "./AnnealCreatorState";
import { init as initMutations } from "./AnnealCreatorMutation";
import { init as initActions } from "./AnnealCreatorAction";

export function init(namespaced: boolean = true) {
    const stateModule: Module<AnnealCreatorState, AnnealCreatorState> = {
        namespaced,

        // We provide an init function so that a new object will be instantiated
        // with each module generated
        state: initState,

        mutations: initMutations(),

        actions: initActions(),
    };

    return stateModule;
}

export { AnnealCreatorState as State } from "./AnnealCreatorState";
export { AnnealCreatorAction as Action, dispatchFactory } from "./AnnealCreatorAction";
