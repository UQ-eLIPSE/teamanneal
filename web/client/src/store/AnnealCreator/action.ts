import { ActionTree, ActionContext, DispatchOptions, Store } from "vuex";

import { AnnealCreatorState } from "./state";
import { AnnealCreatorMutation as M, commit } from "./mutation";

import { FunctionParam2 } from "../../data/FunctionParam2";

import { Constraint, Data as IConstraint } from "../../data/Constraint";
import { ColumnData, Data as IColumnData, MinimalDescriptor as IColumnData_MinimalDescriptor } from "../../data/ColumnData";

import { RecordData } from "../../data/RecordData";
import { Stratum, init as initStratum, equals as stratumEquals } from "../../data/Stratum";
import { init as initStratumSize } from "../../data/StratumSize";
import { StratumNamingConfigContext, Context as StratumNamingConfigContextEnum } from "../../data/StratumNamingConfigContext";

type ActionFunction<A extends AnnealCreatorAction> = typeof actions[A];

type Context = ActionContext<AnnealCreatorState, AnnealCreatorState>;

export enum AnnealCreatorAction {
    HYDRATE = "Hydrating module",
    DEHYDRATE = "Dehydrating module",

    RESET_STATE = "Resetting state",

    SET_RECORD_DATA = "Setting record data",
    CLEAR_RECORD_DATA = "Clearing record data",

    UPSERT_STRATUM = "Upserting stratum",
    DELETE_STRATUM_CONFIRM_SIDE_EFFECT = "Confirming user is aware that constraints will be deleted as side effect, then deleting stratum",

    UPSERT_CONSTRAINT = "Upserting constraint",
    DELETE_CONSTRAINT = "Deleting constraint",

    UPDATE_RECORD_COLUMN_DATA = "Updating a record column's data",

    SET_RECORD_ID_COLUMN = "Setting record ID column",
    CLEAR_RECORD_ID_COLUMN = "Clearing record ID column",

    SET_RECORD_PARTITION_COLUMN = "Setting record partition column",
    CLEAR_RECORD_PARTITION_COLUMN = "Clearing record partition column",


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
        throw new Error("Not implemented");

        // const state = JSON.parse(dehydratedState) as AnnealCreatorState;

        // await dispatch(context, A.SET_RECORD_DATA, state.recordData);
        // // TODO: Constraint config hydration
        // await dispatch(context, A.SET_STRATA, state.strataConfig.strata);
        // await dispatch(context, A.SET_GROUP_NODE_STRUCTURE, state.groupNode.structure);
        // await dispatch(context, A.SET_GROUP_NODE_NAME_MAP, state.groupNode.nameMap);
        // await dispatch(context, A.SET_GROUP_NODE_RECORD_ARRAY_MAP, state.groupNode.nodeRecordArrayMap);

        // if (state.sideToolArea.activeItem !== undefined) {
        //     await dispatch(context, A.SET_SIDE_PANEL_ACTIVE_TOOL, state.sideToolArea.activeItem);
        // } else {
        //     await dispatch(context, A.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
        // }
    },

    async [A.DEHYDRATE](context: Context) {
        return JSON.stringify(context.state);
    },

    async [A.RESET_STATE](context: Context) {
        commit(context, M.CLEAR_RECORD_DATA, undefined);
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
    },

    async [A.SET_RECORD_DATA](context: Context, recordData: RecordData) {
        // Wipe record data first
        await dispatch(context, A.CLEAR_RECORD_DATA, undefined);

        // Set the record data
        commit(context, M.SET_RECORD_DATA, recordData);

        // Add a generic stratum now for users to get started with
        const stratumLabel = "Team";
        const stratumSize = initStratumSize(2, 3, 4);

        const genericStratum = initStratum(stratumLabel, stratumSize);

        await dispatch(context, A.UPSERT_STRATUM, genericStratum);
    },

    async [A.CLEAR_RECORD_DATA](context: Context) {
        commit(context, M.CLEAR_RECORD_DATA, undefined);
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
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
        }

        await dispatch(context, A.updateSystemGeneratedCombinedNameFormat, undefined);
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
            if (stratum.namingConfig.context === stratumId) {
                // We need to copy out the object and merge in the naming 
                // context because we can't do direct object mutations as 
                // the object sits in the state store and non-tracked 
                // mutations are a big no-no

                // TODO: Naming configuration in state store has changed; this 
                // needs rewriting
                await dispatch(context, "upsertStratum",
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
            await dispatch(context, A.SET_COMBINED_NAME_FORMAT, newCombinedNameFormat);
        }

        await dispatch(context, "updateSystemGeneratedCombinedNameFormat", undefined);
    },

    async [A.UPSERT_CONSTRAINT](context: Context, constraint: IConstraint) {
        const constraints = context.state.constraintConfig.constraints;

        // Check if element exists
        const index = constraints.findIndex(c => Constraint.Equals(constraint, c));

        if (index > -1) {
            // Update
            return commit(context, M.SET_CONSTRAINT, { constraint, index });
        } else {
            // Insert
            return commit(context, M.INSERT_CONSTRAINT, constraint);
        }
    },

    async [A.DELETE_CONSTRAINT](context: Context, constraint: IConstraint) {
        // Find index of constraint and delete that one
        const index = context.state.constraintConfig.constraints.findIndex(c => Constraint.Equals(constraint, c));
        commit(context, M.DELETE_CONSTRAINT, index);
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
    },

    async [A.SET_RECORD_ID_COLUMN](context: Context, idColumn: IColumnData_MinimalDescriptor) {
        commit(context, M.SET_RECORD_ID_COLUMN, idColumn);
    },

    async [A.CLEAR_RECORD_ID_COLUMN](context: Context) {
        commit(context, M.CLEAR_RECORD_ID_COLUMN, undefined);
    },

    async [A.SET_RECORD_PARTITION_COLUMN](context: Context, partitionColumn: IColumnData_MinimalDescriptor) {
        commit(context, M.SET_RECORD_PARTITION_COLUMN, partitionColumn);

        await dispatch(context, "updateSystemGeneratedCombinedNameFormat", undefined);
    },

    async [A.CLEAR_RECORD_PARTITION_COLUMN](context: Context) {
        commit(context, M.CLEAR_RECORD_PARTITION_COLUMN, undefined);

        // Check if there are stratum naming contexts which used the 
        // partition naming context; if so, move to the global naming context
        for (let stratum of context.state.strataConfig.strata) {
            if (stratum.namingConfig.context === StratumNamingConfigContextEnum.PARTITION) {
                // We need to copy out the object and merge in the naming 
                // context because we can't do direct object mutations as 
                // the object sits in the state store and non-tracked 
                // mutations are a big no-no

                // TODO: Naming configuration in state store has changed; this 
                // needs rewriting
                await dispatch(context, "upsertStratum",
                    // TODO: Figure out how to best handle the types for this
                    deepMerge<any, any>({}, stratum, {
                        namingConfig: {
                            context: StratumNamingConfigContextEnum.GLOBAL,
                        },
                    })
                );
            }
        }
    },
};

export function init() {
    return actions as ActionTree<AnnealCreatorState, AnnealCreatorState>;
}
