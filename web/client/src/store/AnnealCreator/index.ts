import { Module } from "vuex";
import { AnnealCreatorState, init as initState } from "./state";
import { init as initMutations } from "./mutation";
import { init as initActions } from "./action";
import { init as initGetters } from "./getter";

export function init(namespaced: boolean = true) {
    const stateModule: Module<AnnealCreatorState, AnnealCreatorState> = {
        namespaced,

        // We provide an init function so that a new object will be instantiated
        // with each module generated
        state: initState,

        mutations: initMutations(),

        actions: initActions(),

        getters: initGetters(),
    };

    return stateModule;
}

export { AnnealCreatorState as State } from "./state";
export { AnnealCreatorAction as Action, dispatchFactory } from "./action";
export { AnnealCreatorGetter as Getter, getFactory } from "./getter";
