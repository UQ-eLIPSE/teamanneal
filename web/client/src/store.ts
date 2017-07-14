import Vue from "vue";
import Vuex from "vuex";

import { AxiosError, AxiosPromise, CancelTokenSource } from "axios";

import * as TeamAnnealState from "./data/TeamAnnealState";
import * as ColumnInfo from "./data/ColumnInfo";
import * as Stratum from "./data/Stratum";
import * as Constraint from "./data/Constraint";
import * as AnnealAjax from "./data/AnnealAjax";
import * as CookedData from "./data/CookedData";

Vue.use(Vuex);

const state: TeamAnnealState.TeamAnnealState = {
    /**
     * Stores a copy of the vue-router's full route path
     * 
     * This is updated by the router on "afterEach".
     */
    routerFullPath: "",

    anneal: {
        ajaxRequest: undefined,
        ajaxCancelTokenSource: undefined,

        input: undefined,
        output: undefined,
        outputTree: undefined,
        outputSatisfaction: undefined,
        outputIdNodeMap: undefined,

        outputError: undefined,
    },

    sourceFile: {},
    constraintsConfig: {
        idColumnIndex: undefined,
        partitionColumnIndex: undefined,
        strata: [],
        constraints: [],
    },
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
                idColumnIndex: undefined,
                partitionColumnIndex: undefined,
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
            Vue.set(state.constraintsConfig, "partitionColumnIndex", undefined);
        },

        updateConstraintsConfigStrata(state, stratumUpdate: Stratum.Update) {
            const strata = state.constraintsConfig.strata;
            const newStratum = stratumUpdate.stratum;

            const index = strata.findIndex(stratum => stratum._id === newStratum._id);

            if (index < 0) {
                return;
            }

            Vue.set(strata, index, newStratum);
        },

        insertConstraintsConfigStrata(state, stratum: Stratum.Stratum) {
            state.constraintsConfig.strata.push(stratum);
        },

        deleteConstraintsConfigStrataOf(state, _id: number) {
            const strata = state.constraintsConfig.strata;

            const index = strata.findIndex(stratum => stratum._id === _id);

            if (index < 0) {
                return;
            }

            Vue.delete(strata, index);
        },

        updateConstraintsConfigConstraint(state, constraintUpdate: Constraint.Update) {
            const constraints = state.constraintsConfig.constraints;
            const updatedConstraint = constraintUpdate.constraint;

            const index = constraints.findIndex(constraint => constraint._id === updatedConstraint._id);

            if (index < 0) {
                return;
            }

            Vue.set(constraints, index, updatedConstraint);
        },

        insertConstraintsConfigConstraint(state, constraint: Constraint.Constraint) {
            state.constraintsConfig.constraints.push(constraint);
        },

        deleteConstraintsConfigConstraintOf(state, _id: number) {
            const constraints = state.constraintsConfig.constraints;

            const index = constraints.findIndex(constraint => constraint._id === _id);

            if (index < 0) {
                return;
            }

            Vue.delete(constraints, index);
        },




        // Anneal AJAX and result
        initialiseAnnealAjax(state) {
            state.anneal.ajaxRequest = undefined;
            state.anneal.ajaxCancelTokenSource = undefined;
        },

        initialiseAnnealInputOutput(state) {
            state.anneal.input = undefined;
            state.anneal.output = undefined;
            state.anneal.outputTree = undefined;
            state.anneal.outputSatisfaction = undefined;
            state.anneal.outputError = undefined;
        },

        updateAnnealAjaxRequest(state, request: AxiosPromise) {
            state.anneal.ajaxRequest = request;
        },

        updateAnnealAjaxCancelTokenSource(state, cancelTokenSource: CancelTokenSource) {
            state.anneal.ajaxCancelTokenSource = cancelTokenSource;
        },

        updateAnnealInput(state, input: any) {
            state.anneal.input = input;
        },

        updateAnnealOutput(state, output: TeamAnnealState.AnnealOutput) {
            state.anneal.output = output;
        },

        updateAnnealOutputTree(state, node: AnnealAjax.ResultArrayNode) {
            state.anneal.outputTree = node;
        },

        updateAnnealOutputIdNodeMap(state, map: Map<string, ReadonlyArray<AnnealAjax.ResultArrayNode>>) {
            state.anneal.outputIdNodeMap = map;
        },

        updateAnnealOutputError(state, error: AxiosError) {
            state.anneal.outputError = error;
        },
    },
    actions: {
        // Anneal AJAX and result
        newAnnealAjaxRequest(context, data: any) {
            const $state = context.state;
            const idColumnIndex = $state.constraintsConfig.idColumnIndex;

            // Cancel any existing anneal AJAX request
            const existingCancelTokenSource = $state.anneal.ajaxCancelTokenSource;
            AnnealAjax.cancelAnnealAjaxRequest(existingCancelTokenSource);

            // Wipe existing AJAX and anneal request data
            context.commit("initialiseAnnealAjax");
            context.commit("initialiseAnnealInputOutput");

            // We need the ID column index for processing later
            if (idColumnIndex === undefined) {
                throw new Error("ID column index not defined");
            }

            // Cache the input
            context.commit("updateAnnealInput", data);

            // Create and cache the AJAX request
            if (data === undefined) {
                throw new Error("No input data to send to server");
            }

            const { request, cancelTokenSource } = AnnealAjax.createAnnealAjaxRequest(data);
            context.commit("updateAnnealAjaxRequest", request);
            context.commit("updateAnnealAjaxCancelTokenSource", cancelTokenSource);

            // On AJAX success, we save the output to the state store
            request
                .then((response) => {
                    // TODO: Make an interface for response data
                    const data: any = response.data;
                    const output = data.output;

                    const tree = AnnealAjax.transformOutputIntoTree(output);
                    AnnealAjax.labelTree(tree, context.state.constraintsConfig.strata!);

                    const idToNodeHierarchyMap = AnnealAjax.mapRawDataToNodeHierarchy(idColumnIndex, tree);

                    context.commit("updateAnnealOutput", output);
                    context.commit("updateAnnealOutputTree", tree);
                    context.commit("updateAnnealOutputIdNodeMap", idToNodeHierarchyMap);
                })
                .catch((error: AxiosError) => {
                    // Store the error into the store so that components can 
                    // read out the error
                    context.commit("updateAnnealOutputError", error);
                });
        },

        // Updating column types
        updateColumnType(context, data: any) {
            const oldColumnInfo: ColumnInfo.ColumnInfo = data.columnInfo;
            const newColumnType: string = data.newColumnType;

            const colIndex = oldColumnInfo.index;
            const colLabel = oldColumnInfo.label;
            const rawData = context.state.sourceFile.rawData!;

            // Get the column values again and generate new column info objects
            const valueSet = ColumnInfo.extractColumnValues(rawData, colIndex, true);

            let newColumnInfo: ColumnInfo.ColumnInfo;
            switch (newColumnType) {
                case "number": {
                    newColumnInfo = ColumnInfo.createColumnInfoNumber(colLabel, colIndex, valueSet as Set<number>);
                    break;
                }

                case "string": {
                    newColumnInfo = ColumnInfo.createColumnInfoString(colLabel, colIndex, valueSet as Set<string>);
                    break;
                }

                default:
                    throw new Error("Unknown column type");
            }

            // Update store column info
            const columnInfoReplaceUpdate: ColumnInfo.ReplaceUpdate = { oldColumnInfo, newColumnInfo, };
            context.commit("replaceSourceFileColumnInfo", columnInfoReplaceUpdate);

            // Recook the data with new columns in the store
            const columnInfoArray = context.state.sourceFile.columnInfo!;
            const cookedData = CookedData.cook(columnInfoArray, rawData, true);

            // Serve freshly cooked data to the stale store
            context.commit("updateSourceFileCookedData", cookedData);
        }
    },
});

export default store;
