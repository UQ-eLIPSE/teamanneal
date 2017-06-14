import Vue from "vue";
import Vuex from "vuex";

import * as TeamAnnealState from "./data/TeamAnnealState";
import * as ColumnInfo from "./data/ColumnInfo";
import * as Stratum from "./data/Stratum";
import * as Constraint from "./data/Constraint";

Vue.use(Vuex);

const state: TeamAnnealState.TeamAnnealState = {
    /**
     * Stores a copy of the vue-router's full route path
     * 
     * This is updated by the router on "afterEach".
     */
    routerFullPath: "",

    anneal: {
        input: undefined,
        output: undefined,
        outputSatisfaction: undefined,
    },

    sourceFile: {},
    constraintsConfig: {},
};

const store = new Vuex.Store({
    strict: true,
    state,
    mutations: {
        /// Router
        updateRouterFullPath(state, path: string) {
            state.routerFullPath = path;
        },



        /// Source file (the current open working file)
        initialiseSourceFile(state) {
            state.sourceFile = {};
        },

        updateSourceFileName(state, name: string) {
            Vue.set(state.sourceFile, "name", name);
        },

        updateSourceFileRawData(state, data: ReadonlyArray<ReadonlyArray<string | number>>) {
            Vue.set(state.sourceFile, "rawData", data);
        },

        updateSourceFileCookedData(state, data: ReadonlyArray<ReadonlyArray<string | number | null>>) {
            Vue.set(state.sourceFile, "cookedData", data);
        },

        updateSourceFileColumnInfo(state, columnInfo: ColumnInfo.ColumnInfo[]) {
            Vue.set(state.sourceFile, "columnInfo", columnInfo);
        },

        replaceSourceFileColumnInfo(state, replaceUpdate: ColumnInfo.ReplaceUpdate) {
            const oldInfo = replaceUpdate.oldColumnInfo;
            const newInfo = replaceUpdate.newColumnInfo;

            const columnInfo = state.sourceFile.columnInfo!;

            columnInfo.splice(oldInfo.index, 1, newInfo);
        },



        // Incremental constraints configuration build
        initialiseConstraintsConfig(state) {
            state.constraintsConfig = {
                strata: [],
                constraints: [],
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
            const strata = state.constraintsConfig.strata!;
            const newStratum = stratumUpdate.stratum;

            const index = strata.findIndex(stratum => stratum._id === newStratum._id);

            if (index < 0) {
                return;
            }

            Vue.set(strata, index, newStratum);
        },

        insertConstraintsConfigStrata(state, stratum: Stratum.Stratum) {
            state.constraintsConfig.strata!.push(stratum);
        },

        deleteConstraintsConfigStrataOf(state, _id: number) {
            const strata = state.constraintsConfig.strata!;

            const index = strata.findIndex(stratum => stratum._id === _id);

            if (index < 0) {
                return;
            }

            Vue.delete(strata, index);
        },

        updateConstraintsConfigConstraint(state, constraintUpdate: Constraint.Update) {
            const constraints = state.constraintsConfig.constraints!;
            const updatedConstraint = constraintUpdate.constraint;

            const index = constraints.findIndex(constraint => constraint._id === updatedConstraint._id);

            if (index < 0) {
                return;
            }

            Vue.set(constraints, index, updatedConstraint);
        },

        insertConstraintsConfigConstraint(state, constraint: Constraint.Constraint) {
            state.constraintsConfig.constraints!.push(constraint);
        },

        deleteConstraintsConfigConstraintOf(state, _id: number) {
            const constraints = state.constraintsConfig.constraints!;

            const index = constraints.findIndex(constraint => constraint._id === _id);

            if (index < 0) {
                return;
            }

            Vue.delete(constraints, index);
        },
    },
});

export default store;
