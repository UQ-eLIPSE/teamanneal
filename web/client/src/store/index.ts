import Vue from "vue";
import Vuex from "vuex";

import * as _AnnealCreator from "./AnnealCreator";
import * as _ResultsEditor from "./ResultsEditor";

// Integrate Vuex into Vue
Vue.use(Vuex);

// State store initialisation
export const store = new Vuex.Store({
    strict: process.env.NODE_ENV === "development",

    // NOTE: Type of the state here doesn't matter since we're solely reliant on
    // modules
    state: {} as any,
});

// Module definitions
enum ModulePrefix {
    AnnealCreator = "AnnealCreator",
    ResultsEditor = "ResultsEditor",
}

export const AnnealCreator = {
    prefix: ModulePrefix.AnnealCreator,

    action: _AnnealCreator.Action,
    getter: _AnnealCreator.Getter,

    dispatch: _AnnealCreator.dispatchFactory(store, ModulePrefix.AnnealCreator),
    get: _AnnealCreator.getFactory(store, ModulePrefix.AnnealCreator),

    get state() {
        return store.state[ModulePrefix.AnnealCreator] as _AnnealCreator.State;
    },
};

export const ResultsEditor = {
    prefix: ModulePrefix.ResultsEditor,

    action: _ResultsEditor.Action,
    getter: _ResultsEditor.Getter,

    dispatch: _ResultsEditor.dispatchFactory(store, ModulePrefix.ResultsEditor),
    get: _ResultsEditor.getFactory(store, ModulePrefix.ResultsEditor),

    get state() {
        return store.state[ModulePrefix.ResultsEditor] as _ResultsEditor.State;
    },
};

// Register modules
store.registerModule(ModulePrefix.AnnealCreator, _AnnealCreator.init());
store.registerModule(ModulePrefix.ResultsEditor, _ResultsEditor.init());
