import Vue from "vue";
import Vuex from "vuex";

import { ResultsEditor } from "./ResultsEditor";

import { State, Data as IState } from "../data/State";
import { Stratum, Data as IStratum } from "../data/Stratum";
import { Constraint, Data as IConstraint } from "../data/Constraint";
import { RecordData as IState_RecordData } from "../data/RecordData";
import { AnnealConfig as IState_AnnealConfig } from "../data/AnnealConfig";
import { AnnealRequest, Data as IAnnealRequest } from "../data/AnnealRequest";
import { AnnealResponse, Data as IAnnealResponse, AxiosResponse, AxiosError } from "../data/AnnealResponse";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../data/ColumnData";

import { deepMerge } from "../util/Object";
import { replaceAll } from "../util/String";

Vue.use(Vuex);

const state: IState = State.Init();

const store = new Vuex.Store({
    // strict: process.env.NODE_ENV !== "production",
    state,
    modules: {
        // NOTE: Injecting the ResultsEditor with `any` type as the type
        // conflicts with the existing `state` type
        //
        // TODO: Migrate everything over to the modules scheme so that this type
        // mismatch can be resolved
        resultsEditor: ResultsEditor() as any,
    },
    mutations: {
        /// General root state mutations

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

        /// Anneal request/response

        setAnnealRequest(state, annealRequest: IAnnealRequest) {
            Vue.set(state, "annealRequest", annealRequest);
        },

        setAnnealResponse(state, annealResponse: IAnnealResponse) {
            Vue.set(state, "annealResponse", annealResponse);
        },

        updateAnnealResponseContentIfRequestMatches(state, { request, content }: { request: IAnnealRequest, content: AxiosResponse | AxiosError }) {
            const annealResponse = state.annealResponse;

            if (annealResponse === undefined) {
                return;
            }

            // We must make sure request object does indeed match up with what 
            // we have in the store
            if (!AnnealResponse.RequestMatchesResponse(request, annealResponse)) {
                return;
            }

            // Update `content` on anneal response object
            Vue.set(annealResponse, "content", content);
        },

        /// Combined name format

        setCombinedNameFormat(state, nameFormat: string | undefined) {
            Vue.set(state.annealConfig.namingConfig.combined, "format", nameFormat);
        },

        setCombinedNameUserProvided(state, userProvided: boolean) {
            Vue.set(state.annealConfig.namingConfig.combined, "userProvided", userProvided);
        },
    },
    actions: {
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

            const genericStratum = Stratum.Init(stratumLabel, stratumSize, "_GLOBAL");

            await context.dispatch("upsertStratum", genericStratum);
        },

        /**
         * Upserts a given stratum
         */
        async upsertStratum(context, stratum: IStratum) {
            const strata = context.state.annealConfig.strata;

            // Check if element exists
            const index = strata.findIndex(s => Stratum.Equals(stratum, s));

            if (index > -1) {
                // Update
                context.commit("setStratum", { stratum, index });
            } else {
                // Insert
                context.commit("insertStratum", stratum);
            }

            await context.dispatch("updateSystemGeneratedCombinedNameFormat");
        },

        /**
         * Deletes supplied stratum, but also asks user to confirm this action
         * in the event that constraints will also be deleted
         */
        async deleteStratumConfirmSideEffect(context, stratum: IStratum) {
            const $state = context.state;
            const strata = $state.annealConfig.strata;

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
            const index = strata.findIndex(s => Stratum.Equals(stratum, s));
            context.commit("deleteStratum", index);

            dependentConstraints.forEach((constraint) => {
                const index = constraints.findIndex(c => Constraint.Equals(constraint, c));
                context.commit("deleteConstraint", index);
            });

            // Check if there are stratum naming contexts which used this 
            // stratum ID; if so, move to parent stratum or _GLOBAL
            const parentStratumId = index === 0 ? "_GLOBAL" : strata[index - 1]._id;

            for (let stratum of strata) {
                if (stratum.namingConfig.context === stratumId) {
                    // We need to copy out the object and merge in the naming 
                    // context because we can't do direct object mutations as 
                    // the object sits in the state store and non-tracked 
                    // mutations are a big no-no
                    await context.dispatch("upsertStratum",
                        // TODO: Figure out how to best handle the types for this
                        deepMerge<any, any>({}, stratum, {
                            namingConfig: {
                                context: parentStratumId,
                            },
                        })
                    );
                }
            }

            // Replace the combined name format with a new version that has the 
            // reference to this stratum erased
            const combinedNameFormat = $state.annealConfig.namingConfig.combined.format;

            if (combinedNameFormat !== undefined) {
                const newCombinedNameFormat = replaceAll(combinedNameFormat, `{{${stratumId}}}`, "");
                await context.dispatch("setCombinedNameFormat", newCombinedNameFormat);
            }

            await context.dispatch("updateSystemGeneratedCombinedNameFormat");
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
        async setPartitionColumn(context, partitionColumn: IColumnData | undefined) {
            // Delete partition column if column to set is undefined
            if (partitionColumn === undefined) {
                await context.dispatch("deletePartitionColumn");
            } else {
                context.commit("setPartitionColumn", partitionColumn);
            }

            await context.dispatch("updateSystemGeneratedCombinedNameFormat");
        },

        /**
         * Deletes the partition column set in state
         */
        async deletePartitionColumn(context) {
            context.commit("setPartitionColumn", undefined);

            // Check if there are stratum naming contexts which used the 
            // "_PARTITION" identifier; if so, move to _GLOBAL
            for (let stratum of context.state.annealConfig.strata) {
                if (stratum.namingConfig.context === "_PARTITION") {
                    // We need to copy out the object and merge in the naming 
                    // context because we can't do direct object mutations as 
                    // the object sits in the state store and non-tracked 
                    // mutations are a big no-no
                    await context.dispatch("upsertStratum",
                        // TODO: Figure out how to best handle the types for this
                        deepMerge<any, any>({}, stratum, {
                            namingConfig: {
                                context: "_GLOBAL",
                            },
                        })
                    );
                }
            }

            // Replace the combined name format with a new version that has the 
            // reference to the partition column erased
            const combinedNameFormat = context.state.annealConfig.namingConfig.combined.format;

            if (combinedNameFormat !== undefined) {
                const newCombinedNameFormat = replaceAll(combinedNameFormat, `{{_PARTITION}}`, "");
                await context.dispatch("setCombinedNameFormat", newCombinedNameFormat);
            }

            await context.dispatch("updateSystemGeneratedCombinedNameFormat");
        },

        /**
         * Kills old request (if any) and sets the anneal request object
         */
        setAnnealRequest(context, annealRequest: IAnnealRequest) {
            // Kill any existing request
            const existingAnnealRequest = context.state.annealRequest;

            if (existingAnnealRequest !== undefined) {
                AnnealRequest.Cancel(existingAnnealRequest);
            }

            // Generate anneal response object for receiving the request's reply
            const annealResponse = AnnealResponse.Init(annealRequest);

            // Set new anneal request and response objects
            context.commit("setAnnealRequest", annealRequest);
            context.commit("setAnnealResponse", annealResponse);

            // Once the request completes, we need to update the response object
            // that is paired up with it
            AnnealRequest.WaitForCompletion(annealRequest)
                .then((responseContent) => {
                    // We pass back the request object so that we can check if
                    // request matches what's in the store now
                    const annealResponseUpdate = {
                        request: annealRequest,
                        content: responseContent,   // NOTE: `responseContent` can be response or error
                    };

                    context.commit("updateAnnealResponseContentIfRequestMatches", annealResponseUpdate);
                });
        },

        /**
         * Sets combined name format
         */
        setCombinedNameFormat(context, nameFormat: string | undefined) {
            // If input is effectively blank, then set as undefined
            if (nameFormat !== undefined && nameFormat.trim().length === 0) {
                nameFormat = undefined;
            }

            context.commit("setCombinedNameFormat", nameFormat);
        },

        /**
         * Sets combined name format, but also flags that the format is user 
         * provided
         */
        async setCombinedNameFormatByUser(context, nameFormat: string | undefined) {
            await context.dispatch("setCombinedNameFormat", nameFormat);

            // Flag as user provided name format, if not already flagged
            if (!context.state.annealConfig.namingConfig.combined.userProvided) {
                context.commit("setCombinedNameUserProvided", true);
            }
        },

        /**
         * Updates the system generated combined name format if the format is 
         * not currently user provided
         */
        updateSystemGeneratedCombinedNameFormat(context) {
            const $state = context.state;
            const combinedNameConfig = $state.annealConfig.namingConfig.combined;

            // Only update for non-user-provided name formats
            if (combinedNameConfig.userProvided) {
                return;
            }

            // Map out the names of items currently in strata
            const nameItems = $state.annealConfig.strata.map(stratum => `{{${stratum._id}}}`);

            // Add partition if set
            const partitionColumn = $state.recordData.partitionColumn;

            if (partitionColumn !== undefined) {
                nameItems.unshift("{{_PARTITION}}");
            }

            // Generate name format
            const nameFormat = `Team ${nameItems.join("-")}`;

            context.commit("setCombinedNameFormat", nameFormat);
        }
    },
});

export default store;
