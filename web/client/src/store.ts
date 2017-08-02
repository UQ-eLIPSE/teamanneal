import Vue from "vue";
import Vuex from "vuex";

import { AxiosError, AxiosPromise, CancelTokenSource } from "axios";

import { State, Data as IState, RecordData as IState_RecordData, AnnealConfig as IState_AnnealConfig } from "./data/State";
import { Stratum, Data as IStratum } from "./data/Stratum";
import { Constraint, Data as IConstraint } from "./data/Constraint";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "./data/ColumnData";

Vue.use(Vuex);

const state: IState = State.Init();

const store = new Vuex.Store({
    strict: true,
    state,
    mutations: {
        /// General root state mutations

        initialiseState(state) {
            state = State.Init();
        },

        setRecordData(state, recordData: IState_RecordData) {
            Vue.set(state, "recordData", recordData);
        },

        setAnnealConfig(state, annealConfig: IState_AnnealConfig) {
            Vue.set(state, "annealConfig", annealConfig);
        },

        /// Strata

        insertStratum(state, stratum: IStratum) {
            state.annealConfig.strata.push(stratum);
        },

        setStratum(state, { stratum, index }: { stratum: IStratum, index: number }) {
            Vue.set(state.annealConfig.strata, index, stratum);
        },

        deleteStratum(state, index: number) {
            Vue.delete(state.annealConfig.strata, index);
        },

        /// Constraints

        insertConstraint(state, constraint: IConstraint) {
            state.annealConfig.constraints.push(constraint);
        },

        setConstraint(state, { constraint, index }: { constraint: IConstraint, index: number }) {
            Vue.set(state.annealConfig.constraints, index, constraint);
        },

        deleteConstraint(state, index: number) {
            Vue.delete(state.annealConfig.constraints, index);
        },

        /// Column data

        setColumnData(state, { column, index }: { column: IColumnData, index: number }) {
            Vue.set(state.recordData.columns, index, column);
        },

        /// ID column

        setIdColumn(state, idColumn: IColumnData) {
            const minimalDescriptor = ColumnData.ConvertToMinimalDescriptor(idColumn);
            Vue.set(state.recordData, "idColumn", minimalDescriptor);
        },

        /// Partition column

        setPartitionColumn(state, partitionColumn: IColumnData | undefined) {
            let minimalDescriptor: IColumnData_MinimalDescriptor | undefined;

            if (partitionColumn === undefined) {
                minimalDescriptor = undefined;
            } else {
                minimalDescriptor = ColumnData.ConvertToMinimalDescriptor(partitionColumn);
            }

            Vue.set(state.recordData, "partitionColumn", minimalDescriptor);
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
        /**
         * Initialises state back to a clean slate
         */
        initialiseState(context) {
            context.commit("initialiseState");
        },

        /**
         * Performs all actions when clearing record data:
         * - wipes record data
         * - wipes anneal configuration (because the anneal config depends on 
         *   record data set)
         */
        clearRecordData(context) {
            // Wipe record data
            context.commit("setRecordData", State.GenerateBlankRecordData());

            // Wipe anneal config
            context.commit("setAnnealConfig", State.GenerateBlankAnnealConfig());
        },

        /**
         * Sets new record data and performs all necessary prep work around it
         */
        async setNewRecordData(context, recordData: IState_RecordData) {
            // Wipe record data first
            await context.dispatch("clearRecordData");

            // Set the record data
            context.commit("setRecordData", recordData);

            // Add a generic stratum now for users to get started with
            const stratumLabel = "Team";
            const stratumSize = {
                min: 2,
                ideal: 3,
                max: 4,
            };

            const genericStratum = Stratum.Init(stratumLabel, stratumSize);

            await context.dispatch("upsertStratum", genericStratum);
        },

        /**
         * Upserts a given stratum
         */
        upsertStratum(context, stratum: IStratum) {
            const strata = context.state.annealConfig.strata;

            // Check if element exists
            const index = strata.findIndex(s => Stratum.Equals(stratum, s));

            if (index > -1) {
                // Update
                return context.commit("setStratum", { stratum, index });
            } else {
                // Insert
                return context.commit("insertStratum", stratum);
            }
        },

        /**
         * Deletes supplied stratum, but also asks user to confirm this action
         * in the event that constraints will also be deleted
         */
        deleteStratumConfirmSideEffect(context, stratum: IStratum) {
            const $state = context.state;

            // Check if there are constraints that depend on this stratum
            const constraints = $state.annealConfig.constraints || [];
            const stratumId = stratum._id;
            const stratumLabel = stratum.label;
            const dependentConstraints = constraints.filter(c => c.stratum === stratumId);

            if (dependentConstraints.length > 0) {
                const confirmationMessage =
                    `Deleting "${stratumLabel}" will also result in dependent constraints being deleted.`;

                const proceed = confirm(confirmationMessage);

                // Stop if the user selected Cancel
                if (!proceed) {
                    return;
                }
            }

            // Find index of stratum and delete that one
            const index = $state.annealConfig.strata.findIndex(s => Stratum.Equals(stratum, s));
            context.commit("deleteStratum", index);

            dependentConstraints.forEach((constraint) => {
                const index = $state.annealConfig.constraints.findIndex(c => Constraint.Equals(constraint, c));
                context.commit("deleteConstraint", index);
            });
        },

        /**
         * Upserts a given constraint
         */
        upsertConstraint(context, constraint: IConstraint) {
            const constraints = context.state.annealConfig.constraints;

            // Check if element exists
            const index = constraints.findIndex(c => Constraint.Equals(constraint, c));

            if (index > -1) {
                // Update
                return context.commit("setConstraint", { constraint, index });
            } else {
                // Insert
                return context.commit("insertConstraint", constraint);
            }
        },

        /**
         * Deletes supplied constraint
         */
        deleteConstraint(context, constraint: IConstraint) {
            // Find index of constraint and delete that one
            const index = context.state.annealConfig.constraints.findIndex(c => Constraint.Equals(constraint, c));
            context.commit("deleteConstraint", index);
        },

        /**
         * Updates supplied column
         */
        updateColumnData(context, column: IColumnData) {
            const $state = context.state;

            // Check that the column isn't used by any constraints
            const constraints = $state.annealConfig.constraints;

            if (constraints.some(c => ColumnData.Equals(column, c.filter.column))) {
                const message =
                    `Column "${column.label}" is currently used by at least one constraint and cannot have its type changed.

Delete constraints that use this column and try again.`;

                alert(message);
                return;
            }

            // Find index of column and update it
            const index = $state.recordData.columns.findIndex(c => ColumnData.Equals(column, c));
            context.commit("setColumnData", { column, index });
        },

        /**
         * Sets the ID column to the given column
         */
        setIdColumn(context, idColumn: IColumnData) {
            context.commit("setIdColumn", idColumn);
        },

        /**
         * Sets the partition column to the given column
         */
        setPartitionColumn(context, partitionColumn: IColumnData) {
            context.commit("setPartitionColumn", partitionColumn);
        },

        /**
         * Deletes the partition column set in state
         */
        deletePartitionColumn(context) {
            context.commit("setPartitionColumn", undefined);
        },













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
    },
});

export default store;
