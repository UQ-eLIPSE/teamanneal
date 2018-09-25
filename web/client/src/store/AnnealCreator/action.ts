import { ActionTree, ActionContext, DispatchOptions, Store } from "vuex";

import { AnnealCreatorState as State } from "./state";
import { AnnealCreatorMutation as M, commit } from "./mutation";
import { AnnealCreatorGetter as G } from "./getter";

import { FunctionParam2 } from "../../data/FunctionParam2";

import { Constraint, Data as IConstraint } from "../../data/Constraint";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";

import { RecordData, RecordDataSource } from "../../data/RecordData";
import { Stratum, init as initStratum, equals as stratumEquals } from "../../data/Stratum";
import { init as initStratumSize } from "../../data/StratumSize";
import { init as initStratumNamingConfig, StratumNamingConfig, getStratumNamingConfig } from "../../data/StratumNamingConfig";
import { StratumNamingConfigContext, Context as StratumNamingConfigContextEnum } from "../../data/StratumNamingConfigContext";
import { ListCounterType } from "../../data/ListCounter";
import { AnnealResponse } from "../../data/AnnealResponse";
import * as AnnealRequestState from "../../data/AnnealRequestState";
import * as AnnealCreatorStoreState from "../../data/AnnealCreatorStoreState";

import { deserialiseWithUndefined } from "../../util/Object";
import { setMutation } from "../../util/MutationTrackerUtil";

type ActionFunction<A extends AnnealCreatorAction> = typeof actions[A];

type Context = ActionContext<State, State>;

export enum AnnealCreatorAction {
    HYDRATE = "Hydrating module",
    DEHYDRATE = "Dehydrating module",

    RESET_STATE = "Resetting state",

    SET_RECORD_DATA = "Setting record data",
    INIT_RECORD_DATA = "Initialise state with brand new record data",
    CLEAR_RECORD_DATA = "Clearing record data",

    UPSERT_STRATUM = "Upserting stratum",
    DELETE_STRATUM_CONFIRM_SIDE_EFFECT = "Confirming user is aware that constraints will be deleted as side effect, then deleting stratum",

    INIT_STRATA_NAMING_CONFIG_IF_NOT_PRESENT = "Initialising strata naming config if it is not currently present",

    SET_STRATUM_NAMING_CONFIG = "Setting stratum's naming config",
    SET_STRATUM_NAMING_CONFIG_CONTEXT = "Setting stratum's naming config context",
    SET_STRATUM_NAMING_CONFIG_COUNTER = "Setting stratum's naming config counter",

    UPSERT_CONSTRAINT = "Upserting constraint",
    DELETE_CONSTRAINT = "Deleting constraint",

    SET_RECORD_ID_COLUMN = "Setting record ID column",
    CLEAR_RECORD_ID_COLUMN = "Clearing record ID column",

    SET_RECORD_PARTITION_COLUMN = "Setting record partition column",
    CLEAR_RECORD_PARTITION_COLUMN = "Clearing record partition column",

    SET_RECORD_DATA_SOURCE = "Setting record data source",

    SET_ANNEAL_REQUEST_STATE_TO_NOT_RUNNING = "Setting anneal request state to 'not running'",
    SET_ANNEAL_REQUEST_STATE_TO_IN_PROGRESS = "Setting anneal request state to 'in progress'",
    SET_ANNEAL_REQUEST_STATE_TO_COMPLETED = "Setting anneal request state to 'completed'",
    CLEAR_ANNEAL_REQUEST_STATE = "Clearing anneal request state",

    SET_MUTATION_FLAG_HIGH = "Setting the mutation flag to high",
    SET_MUTATION_FLAG_LOW = "Setting the mutation flag to low",

    SET_IMPORT_FLAG_HIGH = "Setting the import flag to high",
    SET_IMPORT_FLAG_LOW = "Setting the import flag to low",

}

/** Shorthand for Action enum above */
const A = AnnealCreatorAction;

/** Type-safe dispatch function factory */
export function dispatchFactory<T>(store: Store<T>, modulePrefix?: string) {
    const prefix = (modulePrefix !== undefined) ? `${modulePrefix}/` : "";

    return function dispatch<A extends AnnealCreatorAction, F extends ActionFunction<A>>(action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
        actionProxy(action);
        return store.dispatch(prefix + action, payload, options) as ReturnType<F>;
    }
}

// Specify actions which should trigger mutations explicitly, so that this does not happen for every single action,
// especially if new actions are added to the actions list in the future.
export function actionProxy<A extends AnnealCreatorAction>(action: A) {
    switch (action) {
        case A.DELETE_CONSTRAINT:
        case A.UPSERT_CONSTRAINT:
        case A.UPSERT_STRATUM:
        case A.SET_RECORD_PARTITION_COLUMN:
        case A.CLEAR_RECORD_PARTITION_COLUMN:
        case A.SET_RECORD_ID_COLUMN:
        case A.CLEAR_RECORD_ID_COLUMN:
        case A.SET_STRATUM_NAMING_CONFIG_COUNTER:
        case A.SET_STRATUM_NAMING_CONFIG_CONTEXT:
            setMutation();
    }
}

/** Internal dispatch function */
function dispatch<A extends AnnealCreatorAction, F extends ActionFunction<A>>(context: Context, action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
    return context.dispatch(action, payload, options) as ReturnType<F>;
}

/** Store action functions */
const actions = {
    async [A.HYDRATE](context: Context, { dehydratedState, keepExistingRecordDataSource }: { dehydratedState: string, keepExistingRecordDataSource?: boolean }) {
        // Hold reference to existing record data
        const oldRecordData = context.state.recordData;

        // Feed in the dehydrated state
        const state = deserialiseWithUndefined<State>(dehydratedState);

        // Clear data
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
        commit(context, M.CLEAR_RECORD_DATA, undefined);

        // Record data
        if (keepExistingRecordDataSource) {
            await dispatch(context, A.SET_RECORD_DATA_SOURCE, oldRecordData.source);
        } else {
            await dispatch(context, A.SET_RECORD_DATA_SOURCE, state.recordData.source);
        }

        // Read off latest columns from the state
        const columns = context.state.recordData.source.columns;

        // Import the partition and ID columns
        const { partitionColumn, idColumn } = state.recordData;

        if (idColumn !== undefined) {
            const newIdColumn = ColumnData.MatchOldColumnInNewColumns(columns, idColumn, true)!;
            dispatch(context, A.SET_RECORD_ID_COLUMN, newIdColumn);
        }

        if (partitionColumn !== undefined) {
            const newPartitionColumn = ColumnData.MatchOldColumnInNewColumns(columns, partitionColumn, true)!;
            dispatch(context, A.SET_RECORD_PARTITION_COLUMN, newPartitionColumn);
        }

        // Strata config -> strata
        for (let stratum of state.strataConfig.strata) {
            await dispatch(context, A.UPSERT_STRATUM, stratum);
        }

        // Constraints config -> constraints
        for (let constraint of state.constraintConfig.constraints) {
            await dispatch(context, A.UPSERT_CONSTRAINT, constraint);
        }

        // Strata config -> naming config
        const stratumNamingConfig = state.strataConfig.namingConfig;
        if (stratumNamingConfig) {
            commit(context, M.SET_STRATA_NAMING_CONFIG, stratumNamingConfig);
        } else {
            commit(context, M.INIT_STRATA_NAMING_CONFIG, undefined);
        }

        // Constraints config -> constraints
        //
        // We also attempt to match up columns here when inserting constraints
        for (let constraint of state.constraintConfig.constraints) {
            const matchedColumn = ColumnData.MatchOldColumnInNewColumns(columns, constraint.filter.column, true)!;

            // `any` override required due to conflicts between the three
            // constraint types
            await dispatch(context, A.UPSERT_CONSTRAINT, {
                ...constraint,
                filter: {
                    ...constraint.filter,
                    column: ColumnData.ConvertToMinimalDescriptor(matchedColumn),
                },
            } as any);
        }

        // Anneal request state
        //
        // Even though the state defines `annealRequest` to be present always, 
        // we may be importing TARESULTS files which don't have this, in which 
        // case we just shove in a blank anneal request object
        if (state.annealRequest !== undefined) {
            commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, state.annealRequest);
        } else {
            await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
        }
    },

    async [A.DEHYDRATE](context: Context, { deleteRecordDataSource, deleteAnnealRequest }: Partial<{ deleteRecordDataSource: boolean, deleteAnnealRequest: boolean }>) {
        return AnnealCreatorStoreState.dehydrate(context.state, deleteAnnealRequest, deleteRecordDataSource);
    },

    async [A.RESET_STATE](context: Context) {
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
        commit(context, M.CLEAR_RECORD_DATA, undefined);

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_RECORD_DATA](context: Context, recordData: RecordData) {
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

        // Attempt to match up old column references in constraints
        const constraints = context.state.constraintConfig.constraints;
        const columns = context.state.recordData.source.columns;

        for (let constraint of constraints) {
            const newColumn = ColumnData.MatchOldColumnInNewColumns(columns, constraint.filter.column, false);

            if (newColumn !== undefined) {
                // `any` override required due to conflicts between the three
                // constraint types
                await dispatch(context, A.UPSERT_CONSTRAINT, {
                    ...constraint,
                    filter: {
                        ...constraint.filter,
                        column: ColumnData.ConvertToMinimalDescriptor(newColumn),
                    },
                } as any);
            }
        }

        await dispatch(context, A.CLEAR_ANNEAL_REQUEST_STATE, undefined);
    },

    async [A.SET_RECORD_DATA_SOURCE](context: Context, recordDataSource: RecordDataSource) {
        // Set the record data source
        commit(context, M.SET_RECORD_DATA_SOURCE, recordDataSource);
    },

    async [A.INIT_RECORD_DATA](context: Context, recordData: RecordData) {
        // Wipe record data first
        await dispatch(context, A.CLEAR_RECORD_DATA, undefined);

        // Set record data back in
        await dispatch(context, A.SET_RECORD_DATA, recordData);

        // Add a generic stratum now for users to get started with
        const stratumLabel = "Team";
        const stratumSize = initStratumSize(2, 3, 4);

        const genericStratum = initStratum(stratumLabel, stratumSize);

        await dispatch(context, A.UPSERT_STRATUM, genericStratum);
    },

    async [A.CLEAR_RECORD_DATA](context: Context) {

        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
        commit(context, M.CLEAR_RECORD_DATA, undefined);

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
            // Create new naming config by default
            await dispatch(context, A.SET_STRATUM_NAMING_CONFIG, { stratum, namingConfig: initStratumNamingConfig() });

            // Insert
            commit(context, M.INSERT_STRATUM, stratum);
        }

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

    async [A.SET_ANNEAL_REQUEST_STATE_TO_NOT_RUNNING](context: Context) {
        commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, AnnealRequestState.initNotRunning());
    },

    async [A.SET_ANNEAL_REQUEST_STATE_TO_IN_PROGRESS](context: Context, data: Record<string, any>) {
        commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, AnnealRequestState.initInProgress(data));
    },

    async [A.SET_ANNEAL_REQUEST_STATE_TO_COMPLETED](context: Context, response: AnnealResponse) {
        commit(context, M.SET_ANNEAL_REQUEST_STATE_OBJECT, AnnealRequestState.initCompleted(response));
    },

    async [A.CLEAR_ANNEAL_REQUEST_STATE](context: Context) {
        if (!AnnealRequestState.isNotRunning(context.state.annealRequest)) {
            await dispatch(context, A.SET_ANNEAL_REQUEST_STATE_TO_NOT_RUNNING, undefined);
        }
    },

    async [A.SET_MUTATION_FLAG_HIGH](context: Context) {
        commit(context, M.SET_MUTATION_FLAG, true);
    },

    async [A.SET_MUTATION_FLAG_LOW](context: Context) {
        commit(context, M.SET_MUTATION_FLAG, false);
    },

    async [A.SET_IMPORT_FLAG_HIGH](context: Context) {
        commit(context, M.SET_IMPORT_FLAG, true);
    },

    async [A.SET_IMPORT_FLAG_LOW](context: Context) {
        commit(context, M.SET_IMPORT_FLAG, false);
    },
};

export function init() {
    return actions as ActionTree<State, State>;
}
