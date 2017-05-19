import Vue from "vue";
import Vuex from "vuex";

import * as TeamAnnealState from "./data/TeamAnnealState";
import * as ColumnInfo from "./data/ColumnInfo";


Vue.use(Vuex);

const state: TeamAnnealState.TeamAnnealState = {
    sourceFile: {},
    constraintsConfig: {},
};

const store = new Vuex.Store({
    strict: true,
    state,
    mutations: {
        /// Source file (the current open working file)
        initialiseSourceFile(state) {
            state.sourceFile = {};
        },

        updateSourceFileName(state, name: string) {
            Vue.set(state.sourceFile, "name", name);
        },

        updateSourceFileData(state, data: (string | number)[][]) {
            Vue.set(state.sourceFile, "data", data);
        },

        updateSourceFileColumnInfo(state, columnInfo: ColumnInfo.ColumnInfo[]) {
            Vue.set(state.sourceFile, "columnInfo", columnInfo);
        },



        // Incremental constraints configuration build
        initialiseConstraintsConfig(state) {
            state.constraintsConfig = {};
        },

        updateConstraintsConfigIdColumnIndex(state, i: number) {
            Vue.set(state.constraintsConfig, "idColumnIndex", i);
        },

        updateConstraintsConfigPartitionColumnIndex(state, i: number) {
            Vue.set(state.constraintsConfig, "partitionColumnIndex", i);
        },

        deleteConstraintsConfigPartitionColumnIndex(state) {
            Vue.delete(state.constraintsConfig, "partitionColumnIndex");
        },
    },
});

export default store;
