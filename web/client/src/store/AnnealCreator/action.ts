import { ActionTree, ActionContext, DispatchOptions, Store } from "vuex";

import { AnnealCreatorState as State } from "./state";
import { AnnealCreatorMutation as M, commit } from "./mutation";
import { AnnealCreatorGetter as G } from "./getter";

import { FunctionParam2 } from "../../data/FunctionParam2";

import { Constraint, Data as IConstraint } from "../../data/Constraint";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";

import { RecordData, init as initRecordData } from "../../data/RecordData";
import { Stratum, init as initStratum, equals as stratumEquals } from "../../data/Stratum";
import { init as initStratumSize } from "../../data/StratumSize";
import { init as initStratumNamingConfig, StratumNamingConfig, getStratumNamingConfig } from "../../data/StratumNamingConfig";
import { StratumNamingConfigContext, Context as StratumNamingConfigContextEnum } from "../../data/StratumNamingConfigContext";
import { ListCounterType } from "../../data/ListCounter";
import { AnnealResponse } from "../../data/AnnealResponse";
import * as AnnealRequestState from "../../data/AnnealRequestState";

import { replaceAll } from "../../util/String";
import { serialiseWithUndefined, deserialiseWithUndefined } from "../../util/Object";

type ActionFunction<A extends AnnealCreatorAction> = typeof actions[A];

type Context = ActionContext<State, State>;

export enum AnnealCreatorAction {
    HYDRATE = "Hydrating module",
    DEHYDRATE = "Dehydrating module",

    RESET_STATE = "Resetting state",

    SET_RECORD_DATA = "Setting record data",
    CLEAR_RECORD_DATA = "Clearing record data",

    UPSERT_STRATUM = "Upserting stratum",
    DELETE_STRATUM_CONFIRM_SIDE_EFFECT = "Confirming user is aware that constraints will be deleted as side effect, then deleting stratum",

    INIT_STRATA_NAMING_CONFIG_IF_NOT_PRESENT = "Initialising strata naming config if it is not currently present",

    SET_STRATUM_NAMING_CONFIG = "Setting stratum's naming config",
    SET_STRATUM_NAMING_CONFIG_CONTEXT = "Setting stratum's naming config context",
    SET_STRATUM_NAMING_CONFIG_COUNTER = "Setting stratum's naming config counter",

    UPSERT_CONSTRAINT = "Upserting constraint",
    DELETE_CONSTRAINT = "Deleting constraint",

    UPDATE_RECORD_COLUMN_DATA = "Updating a record column's data",

    SET_RECORD_ID_COLUMN = "Setting record ID column",
    CLEAR_RECORD_ID_COLUMN = "Clearing record ID column",

    SET_RECORD_PARTITION_COLUMN = "Setting record partition column",
    CLEAR_RECORD_PARTITION_COLUMN = "Clearing record partition column",

    SET_NODE_NAMING_COMBINED_NAME_FORMAT = "Setting node naming combined name format",
    CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT = "Clearing node naming combined name format",
    SET_NODE_NAMING_COMBINED_NAME_FORMAT_BY_USER = "Setting node naming combined name format and flagging it as being set by user",
    CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT_BY_USER = "Clearing node naming combined name format and flagging it as being set by user",

    UPDATE_SYSTEM_GENERATED_NODE_NAMING_COMBINED_NAME_FORMAT = "Updating system generated node naming combined name format",

    SET_ANNEAL_REQUEST_STATE_TO_NOT_RUNNING = "Setting anneal request state to 'not running'",
    SET_ANNEAL_REQUEST_STATE_TO_IN_PROGRESS = "Setting anneal request state to 'in progress'",
    SET_ANNEAL_REQUEST_STATE_TO_COMPLETED = "Setting anneal request state to 'completed'",
    CLEAR_ANNEAL_REQUEST_STATE = "Clearing anneal request state",

    SET_DATA_IMPORT_MODE = "Setting data import mode",
}

/** Shorthand for Action enum above */
const A = AnnealCreatorAction;

/** Type-safe dispatch function factory */
export function dispatchFactory<T>(store: Store<T>, modulePrefix?: string) {
    const prefix = (modulePrefix !== undefined) ? `${modulePrefix}/` : "";

    return function dispatch<A extends AnnealCreatorAction, F extends ActionFunction<A>>(action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
        return store.dispatch(prefix + action, payload, options) as ReturnType<F>;
    }
}

/** Internal dispatch function */
function dispatch<A extends AnnealCreatorAction, F extends ActionFunction<A>>(context: Context, action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
    return context.dispatch(action, payload, options) as ReturnType<F>;
}

/** Store action functions */
const actions = {
    async [A.HYDRATE](context: Context, dehydratedState: string) {
        const state = deserialiseWithUndefined<State>(dehydratedState);

        await dispatch(context, A.RESET_STATE, undefined);

        // Record data
        await dispatch(context, A.SET_RECORD_DATA, state.recordData);

        // Constraints config -> constraints
        for (let constraint of state.constraintConfig.constraints) {
            await dispatch(context, A.UPSERT_CONSTRAINT, constraint);
        }

        // Strata config -> strata
        for (let stratum of state.strataConfig.strata) {
            await dispatch(context, A.UPSERT_STRATUM, stratum);
        }

        // Strata config -> naming config
        const stratumNamingConfig = state.strataConfig.namingConfig;
        if (stratumNamingConfig) {
            commit(context, M.SET_STRATA_NAMING_CONFIG, stratumNamingConfig);
        } else {
            commit(context, M.INIT_STRATA_NAMING_CONFIG, undefined);
        }

        // Node naming config -> combined name config
        const combinedNameConfig = state.nodeNamingConfig.combined;
        if (combinedNameConfig.format) {
            await dispatch(context, A.SET_NODE_NAMING_COMBINED_NAME_FORMAT, combinedNameConfig.format);
        } else {
            await dispatch(context, A.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);
        }
        commit(context, M.SET_NODE_NAMING_COMBINED_NAME_USER_PROVIDED_FLAG, combinedNameConfig.userProvided);

        // Anneal request state
        commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, state.annealRequest);
    },

    async [A.DEHYDRATE](context: Context, { deleteDataImportMode, deleteRecordData, deleteAnnealRequest }: Partial<{ deleteDataImportMode: boolean, deleteRecordData: boolean, deleteAnnealRequest: boolean }>) {
        const state = { ...context.state };

        // Clear parts of state object, where requested

        if (deleteDataImportMode) {
            state.dataImportMode = undefined;
        }

        if (deleteRecordData) {
            state.recordData = initRecordData();
        }

        if (deleteAnnealRequest) {
            state.annealRequest = AnnealRequestState.initNotRunning();
        }

        return serialiseWithUndefined(state);
    },

    async [A.RESET_STATE](context: Context) {
        commit(context, M.CLEAR_RECORD_DATA, undefined);
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
        commit(context, M.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_RECORD_DATA](context: Context, recordData: RecordData) {
        // Wipe record data first
        await dispatch(context, A.CLEAR_RECORD_DATA, undefined);

        // Set the record data
        commit(context, M.SET_RECORD_DATA, recordData);

        // Set default ID column to first available ID column if present
        //
        // We can't use the nice type safe getters here because they would
        // not have been initialised at this point in time, and trying to force
        // it in may introduce a circular dependency
        const validIdColumns: ReadonlyArray<IColumnData> = context.getters[G.VALID_ID_COLUMNS];

        if (validIdColumns.length > 0) {
            await dispatch(context, A.SET_RECORD_ID_COLUMN, ColumnData.ConvertToMinimalDescriptor(validIdColumns[0]));
        }

        // Add a generic stratum now for users to get started with
        const stratumLabel = "Team";
        const stratumSize = initStratumSize(2, 3, 4);

        const genericStratum = initStratum(stratumLabel, stratumSize);

        await dispatch(context, A.UPSERT_STRATUM, genericStratum);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.CLEAR_RECORD_DATA](context: Context) {

        commit(context, M.CLEAR_RECORD_DATA, undefined);
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.UPSERT_STRATUM](context: Context, stratum: Stratum) {
        const strata = context.state.strataConfig.strata;

        // Check if element exists
        const index = strata.findIndex(s => stratumEquals(stratum, s));

        if (index > -1) {
            // Update
            commit(context, M.SET_STRATUM, { stratum, index });
        } else {
            // Insert
            commit(context, M.INSERT_STRATUM, stratum);

            // Create new naming config by default
            await dispatch(context, A.SET_STRATUM_NAMING_CONFIG, { stratum, namingConfig: initStratumNamingConfig() });
        }

        await dispatch(context, A.UPDATE_SYSTEM_GENERATED_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.DELETE_STRATUM_CONFIRM_SIDE_EFFECT](context: Context, stratum: Stratum) {
        const $state = context.state;
        const strata = $state.strataConfig.strata;

        // Check if there are constraints that depend on this stratum
        const constraints = $state.constraintConfig.constraints || [];
        const stratumId = stratum._id;
        const stratumLabel = stratum.label;
        const dependentConstraints = constraints.filter(c => c.stratum === stratumId);

        if (dependentConstraints.length > 0) {
            const confirmationMessage = `Deleting "${stratumLabel}" will also result in dependent constraints being deleted.`;

            const proceed = confirm(confirmationMessage);

            // Stop if the user selected Cancel
            if (!proceed) {
                return;
            }
        }

        // Find index of stratum and delete that one
        const stratumIndex = strata.findIndex(s => stratumEquals(stratum, s));
        commit(context, M.DELETE_STRATUM, stratumIndex);

        dependentConstraints.forEach((constraint) => {
            const constraintIndex = constraints.findIndex(c => Constraint.Equals(constraint, c));
            commit(context, M.DELETE_CONSTRAINT, constraintIndex);
        });

        // Check if there are stratum naming contexts which used this 
        // stratum ID; if so, move to parent stratum or to the global naming 
        // context
        const parentStratumId: StratumNamingConfigContext =
            stratumIndex === 0 ?
                StratumNamingConfigContextEnum.GLOBAL :
                strata[stratumIndex - 1]._id;

        for (let stratum of strata) {
            if (getStratumNamingConfig(context.state.strataConfig, stratum._id).context === stratumId) {
                await dispatch(context, A.SET_STRATUM_NAMING_CONFIG_CONTEXT, {
                    stratum,
                    context: parentStratumId,
                });
            }
        }

        // Replace the combined name format with a new version that has the 
        // reference to this stratum erased
        const combinedNameFormat = $state.nodeNamingConfig.combined.format;

        if (combinedNameFormat !== undefined) {
            const newCombinedNameFormat = replaceAll(combinedNameFormat, `{{${stratumId}}}`, "");
            await dispatch(context, A.SET_NODE_NAMING_COMBINED_NAME_FORMAT, newCombinedNameFormat);
        }

        await dispatch(context, A.UPDATE_SYSTEM_GENERATED_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.INIT_STRATA_NAMING_CONFIG_IF_NOT_PRESENT](context: Context) {
        if (context.state.strataConfig.namingConfig === undefined) {
            commit(context, M.INIT_STRATA_NAMING_CONFIG, undefined);
        }

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_STRATUM_NAMING_CONFIG](context: Context, { stratum, namingConfig }: { stratum: Stratum, namingConfig: StratumNamingConfig }) {
        await dispatch(context, A.INIT_STRATA_NAMING_CONFIG_IF_NOT_PRESENT, undefined);
        commit(context, M.SET_STRATUM_NAMING_CONFIG, { stratumId: stratum._id, namingConfig });

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_STRATUM_NAMING_CONFIG_CONTEXT](stateContext: Context, { stratum, context }: { stratum: Stratum, context: StratumNamingConfigContext }) {
        await dispatch(stateContext, A.INIT_STRATA_NAMING_CONFIG_IF_NOT_PRESENT, undefined);
        commit(stateContext, M.SET_STRATUM_NAMING_CONFIG_CONTEXT, { stratumId: stratum._id, context });

        await dispatch(stateContext, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_STRATUM_NAMING_CONFIG_COUNTER](context: Context, { stratum, counter }: { stratum: Stratum, counter: ListCounterType | string[] }) {
        await dispatch(context, A.INIT_STRATA_NAMING_CONFIG_IF_NOT_PRESENT, undefined);
        commit(context, M.SET_STRATUM_NAMING_CONFIG_COUNTER, { stratumId: stratum._id, counter });

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.UPSERT_CONSTRAINT](context: Context, constraint: IConstraint) {
        const constraints = context.state.constraintConfig.constraints;

        // Check if element exists
        const index = constraints.findIndex(c => Constraint.Equals(constraint, c));

        if (index > -1) {
            // Update
            commit(context, M.SET_CONSTRAINT, { constraint, index });
        } else {
            // Insert
            commit(context, M.INSERT_CONSTRAINT, constraint);
        }

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.DELETE_CONSTRAINT](context: Context, constraint: IConstraint) {
        // Find index of constraint and delete that one
        const index = context.state.constraintConfig.constraints.findIndex(c => Constraint.Equals(constraint, c));
        commit(context, M.DELETE_CONSTRAINT, index);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.UPDATE_RECORD_COLUMN_DATA](context: Context, column: IColumnData) {
        const $state = context.state;

        // Check that the column isn't used by any constraints
        const constraints = $state.constraintConfig.constraints;

        if (constraints.some(c => ColumnData.Equals(column, c.filter.column))) {
            const message =
                `Column "${column.label}" is currently used by at least one constraint and cannot have its type changed.

Delete constraints that use this column and try again.`;

            alert(message);
            return;
        }

        // Find index of column and update it
        const index = $state.recordData.columns.findIndex(c => ColumnData.Equals(column, c));
        commit(context, M.SET_RECORD_COLUMN_DATA, { column, index });

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_RECORD_ID_COLUMN](context: Context, idColumn: IColumnData_MinimalDescriptor) {
        commit(context, M.SET_RECORD_ID_COLUMN, idColumn);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.CLEAR_RECORD_ID_COLUMN](context: Context) {
        commit(context, M.CLEAR_RECORD_ID_COLUMN, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_RECORD_PARTITION_COLUMN](context: Context, partitionColumn: IColumnData_MinimalDescriptor) {
        commit(context, M.SET_RECORD_PARTITION_COLUMN, partitionColumn);

        await dispatch(context, A.UPDATE_SYSTEM_GENERATED_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.CLEAR_RECORD_PARTITION_COLUMN](context: Context) {
        commit(context, M.CLEAR_RECORD_PARTITION_COLUMN, undefined);

        // Check if there are stratum naming contexts which used the 
        // partition naming context; if so, move to the global naming context
        for (let stratum of context.state.strataConfig.strata) {
            if (getStratumNamingConfig(context.state.strataConfig, stratum._id).context === StratumNamingConfigContextEnum.PARTITION) {
                await dispatch(context, A.SET_STRATUM_NAMING_CONFIG_CONTEXT, {
                    stratum,
                    context: StratumNamingConfigContextEnum.GLOBAL,
                });
            }
        }

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_NODE_NAMING_COMBINED_NAME_FORMAT](context: Context, nameFormat: string) {
        // If input is effectively blank, then set as undefined
        if (nameFormat.trim().length === 0) {
            await dispatch(context, A.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);
        } else {
            commit(context, M.SET_NODE_NAMING_COMBINED_NAME_FORMAT, nameFormat);
        }

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT](context: Context) {
        commit(context, M.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_NODE_NAMING_COMBINED_NAME_FORMAT_BY_USER](context: Context, nameFormat: string) {
        await dispatch(context, A.SET_NODE_NAMING_COMBINED_NAME_FORMAT, nameFormat);

        // Flag as user provided name format, if not already flagged
        if (!context.state.nodeNamingConfig.combined.userProvided) {
            commit(context, M.SET_NODE_NAMING_COMBINED_NAME_USER_PROVIDED_FLAG, true);
        }

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT_BY_USER](context: Context) {
        await dispatch(context, A.CLEAR_NODE_NAMING_COMBINED_NAME_FORMAT, undefined);

        // Flag as user provided name format, if not already flagged
        if (!context.state.nodeNamingConfig.combined.userProvided) {
            commit(context, M.SET_NODE_NAMING_COMBINED_NAME_USER_PROVIDED_FLAG, true);
        }

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.UPDATE_SYSTEM_GENERATED_NODE_NAMING_COMBINED_NAME_FORMAT](context: Context) {
        const $state = context.state;
        const combinedNameConfig = $state.nodeNamingConfig.combined;

        // Only update for non-user-provided name formats
        if (combinedNameConfig.userProvided) {
            return;
        }

        // Map out the names of items currently in strata
        const nameItems = $state.strataConfig.strata.map(stratum => `{{${stratum._id}}}`);

        // Add partition if set
        const partitionColumn = $state.recordData.partitionColumn;

        if (partitionColumn !== undefined) {
            nameItems.unshift("{{_PARTITION}}");
        }

        // Generate name format
        const nameFormat = `Team ${nameItems.join("-")}`;

        await dispatch(context, A.SET_NODE_NAMING_COMBINED_NAME_FORMAT, nameFormat);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_ANNEAL_REQUEST_STATE_TO_NOT_RUNNING](context: Context) {
        commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, AnnealRequestState.initNotRunning());
    },

    async [A.SET_ANNEAL_REQUEST_STATE_TO_IN_PROGRESS](context: Context) {
        commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, AnnealRequestState.initInProgress());
    },

    async [A.SET_ANNEAL_REQUEST_STATE_TO_COMPLETED](context: Context, response: AnnealResponse) {
        commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, AnnealRequestState.initCompleted(response));
    },

    async [A.CLEAR_ANNEAL_REQUEST_STATE](context: Context) {
        if (!AnnealRequestState.isNotRunning(context.state.annealRequest)) {
            await dispatch(context, A.SET_ANNEAL_REQUEST_STATE_TO_NOT_RUNNING, undefined);
        }
    },

    async [A.SET_DATA_IMPORT_MODE](context: Context, dataImportMode: "new-records-file" | "import-config-file-with-separate-records-file") {
        commit(context, M.SET_DATA_IMPORT_MODE, dataImportMode);
    },
};

export function init() {
    return actions as ActionTree<State, State>;
}
