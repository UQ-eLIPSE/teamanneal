import Vue from "vue";
import Vuex from "vuex";

import * as TeamAnnealState from "./data/TeamAnnealState";
import * as ColumnInfo from "./data/ColumnInfo";
import * as Stratum from "./data/Stratum";

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
            state.constraintsConfig = {
                strata: [],
            };
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

        updateConstraintsConfigStrata(state, stratumUpdate: Stratum.Update) {
            Vue.set(state.constraintsConfig.strata!, stratumUpdate.index, stratumUpdate.stratum);
        },

        insertConstraintsConfigStrata(state, stratum: Stratum.Stratum) {
            state.constraintsConfig.strata!.push(stratum);
        },

        deleteConstraintsConfigStrataAt(state, index: number) {
            Vue.delete(state.constraintsConfig.strata!, index);
        },

        swapUpConstraintsConfigStrataAt(state, index: number) {
            // Can't swap with previous item
            if (index === 0) {
                return;
            }

            const strata = state.constraintsConfig.strata!;

            const a = strata[index - 1];
            const b = strata[index];

            strata.splice(index - 1, 1, b);
            strata.splice(index, 1, a);
        },

        swapDownConstraintsConfigStrataAt(state, index: number) {
            const strata = state.constraintsConfig.strata!;

            // Can't swap with next item
            if (index === strata.length - 1) {
                return;
            }

            const a = strata[index + 1];
            const b = strata[index];

            strata.splice(index + 1, 1, b);
            strata.splice(index, 1, a);
        }
    },
});

export default store;
