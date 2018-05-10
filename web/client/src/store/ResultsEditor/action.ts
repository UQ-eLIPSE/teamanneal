import { ActionTree, ActionContext, DispatchOptions, Store } from "vuex";

import { ResultsEditorState as State } from "./state";
import { ResultsEditorMutation as M, commit } from "./mutation";

import { State as AnnealCreatorState } from "../AnnealCreator";

import { RecordData } from "../../data/RecordData";
import { GroupNodeNameMap } from "../../data/GroupNodeNameMap";
import { GroupNodeStructure } from "../../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";
import { Stratum } from "../../data/Stratum";
import { SidePanelActiveTool } from "../../data/SidePanelActiveTool";
import { FunctionParam2 } from "../../data/FunctionParam2";

import { RecordElement } from "../../../../common/Record";

import { deserialiseWithUndefined, serialiseWithUndefined, deepMerge } from "../../util/Object";
import { generateGroupNodeCompatibleData } from "../AnnealCreator/state";

type ActionFunction<A extends ResultsEditorAction> = typeof actions[A];

type Context = ActionContext<State, State>;

export enum ResultsEditorAction {
    HYDRATE = "Hydrating module",
    DEHYDRATE = "Dehydrating module",

    HYDRATE_FROM_ANNEAL_CREATOR_STATE = "Hydrating from dehydrated AnnealCreator state",

    RESET_STATE = "Resetting state",

    SET_RECORD_DATA = "Setting record data",

    SET_STRATA = "Setting strata",

    SET_GROUP_NODE_STRUCTURE = "Setting group node structure",

    SET_GROUP_NODE_NAME_MAP = "Setting group node name map",

    SET_GROUP_NODE_RECORD_ARRAY_MAP = "Setting group node record array map",

    SET_SIDE_PANEL_ACTIVE_TOOL = "Setting side panel active tool",
    SET_SIDE_PANEL_ACTIVE_TOOL_BY_NAME = "Setting side panel active tool by name",
    CLEAR_SIDE_PANEL_ACTIVE_TOOL = "Clearing side panel active tool",

    PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA = "Partially update side panel active tool internal data",

    MOVE_RECORD_TO_GROUP_NODE = "Moving record to group node",

    SWAP_RECORDS = "Swapping records",
}

/** Shorthand for Action enum above */
const A = ResultsEditorAction;

/** Type-safe dispatch function factory */
export function dispatchFactory<T>(store: Store<T>, modulePrefix?: string) {
    const prefix = (modulePrefix !== undefined) ? `${modulePrefix}/` : "";

    return function dispatch<A extends ResultsEditorAction, F extends ActionFunction<A>>(action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
        return store.dispatch(prefix + action, payload, options) as ReturnType<F>;
    }
}

/** Internal dispatch function */
function dispatch<A extends ResultsEditorAction, F extends ActionFunction<A>>(context: Context, action: A, payload: FunctionParam2<F>, options?: DispatchOptions): ReturnType<F> {
    return context.dispatch(action, payload, options) as ReturnType<F>;
}

/** Store action functions */
const actions = {
    async [A.HYDRATE](context: Context, dehydratedState: string) {
        const state = deserialiseWithUndefined<State>(dehydratedState);

        await dispatch(context, A.RESET_STATE, undefined);

        await dispatch(context, A.SET_RECORD_DATA, state.recordData);

        for (let constraint of state.constraintConfig.constraints) {
            commit(context, M.INSERT_CONSTRAINT, constraint);
        }

        await dispatch(context, A.SET_STRATA, state.strataConfig.strata);

        await dispatch(context, A.SET_GROUP_NODE_STRUCTURE, state.groupNode.structure);
        await dispatch(context, A.SET_GROUP_NODE_NAME_MAP, state.groupNode.nameMap);
        await dispatch(context, A.SET_GROUP_NODE_RECORD_ARRAY_MAP, state.groupNode.nodeRecordArrayMap);

        if (state.sideToolArea.activeItem !== undefined) {
            await dispatch(context, A.SET_SIDE_PANEL_ACTIVE_TOOL, state.sideToolArea.activeItem);
        } else {
            await dispatch(context, A.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
        }
    },

    async [A.DEHYDRATE](context: Context) {
        return serialiseWithUndefined(context.state);
    },

    async [A.HYDRATE_FROM_ANNEAL_CREATOR_STATE](context: Context, dehydratedState: string) {
        const annealCreatorState = deserialiseWithUndefined<AnnealCreatorState>(dehydratedState);

        // Generate names from the data in the AnnealCreator state
        const { roots, nameMap, nodeRecordArrayMap } = generateGroupNodeCompatibleData(annealCreatorState);

        await dispatch(context, A.RESET_STATE, undefined);

        await dispatch(context, A.SET_RECORD_DATA, annealCreatorState.recordData);

        for (let constraint of annealCreatorState.constraintConfig.constraints) {
            commit(context, M.INSERT_CONSTRAINT, constraint);
        }

        await dispatch(context, A.SET_STRATA, annealCreatorState.strataConfig.strata);

        await dispatch(context, A.SET_GROUP_NODE_STRUCTURE, { roots });
        await dispatch(context, A.SET_GROUP_NODE_NAME_MAP, nameMap);
        await dispatch(context, A.SET_GROUP_NODE_RECORD_ARRAY_MAP, nodeRecordArrayMap);
    },

    async [A.RESET_STATE](context: Context) {
        commit(context, M.CLEAR_RECORD_DATA, undefined);
        commit(context, M.CLEAR_CONSTRAINTS, undefined);
        commit(context, M.CLEAR_STRATA, undefined);
        commit(context, M.CLEAR_GROUP_NODE_STRUCTURE, undefined);
        commit(context, M.CLEAR_GROUP_NODE_NAME_MAP, undefined);
        commit(context, M.CLEAR_GROUP_NODE_RECORD_ARRAY_MAP, undefined);
        await dispatch(context, A.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
    },

    async [A.SET_RECORD_DATA](context: Context, recordData: RecordData) {
        commit(context, M.SET_RECORD_DATA, recordData);
    },

    async [A.SET_STRATA](context: Context, strata: Stratum[]) {
        // Clear all strata, then iterate through array and insert
        commit(context, M.CLEAR_STRATA, undefined);

        // Strata insertions must be done atomically due to certain checks and
        // getters requiring all strata to be present at once
        commit(context, M.INSERT_STRATA, strata);
    },

    async [A.SET_GROUP_NODE_STRUCTURE](context: Context, structure: GroupNodeStructure) {
        commit(context, M.SET_GROUP_NODE_STRUCTURE, structure);
    },

    async [A.SET_GROUP_NODE_NAME_MAP](context: Context, nameMap: GroupNodeNameMap) {
        commit(context, M.SET_GROUP_NODE_NAME_MAP, nameMap);
    },

    async [A.SET_GROUP_NODE_RECORD_ARRAY_MAP](context: Context, nodeRecordArrayMap: GroupNodeRecordArrayMap) {
        commit(context, M.SET_GROUP_NODE_RECORD_ARRAY_MAP, nodeRecordArrayMap);
    },

    async [A.SET_SIDE_PANEL_ACTIVE_TOOL](context: Context, data: SidePanelActiveTool) {
        commit(context, M.SET_SIDE_PANEL_ACTIVE_TOOL, data);
    },

    async [A.SET_SIDE_PANEL_ACTIVE_TOOL_BY_NAME](context: Context, name: string) {
        commit(context, M.SET_SIDE_PANEL_ACTIVE_TOOL, { name, data: {} });
    },

    async [A.CLEAR_SIDE_PANEL_ACTIVE_TOOL](context: Context) {
        commit(context, M.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
    },

    async [A.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA](context: Context, data: object) {
        const activeItem = context.state.sideToolArea.activeItem;

        if (activeItem === undefined) {
            throw new Error("No side panel active tool object");
        }

        // If data not previously set, just write directly
        if (activeItem.data === undefined) {
            commit(context, M.SET_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, data);
            return;
        }

        // Partially update data objects
        const mergedData = deepMerge<object>({}, activeItem.data, data);
        commit(context, M.SET_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, mergedData);
    },

    async [A.MOVE_RECORD_TO_GROUP_NODE](context: Context, { sourcePerson, targetGroup }: { sourcePerson: { node: string, id: RecordElement }, targetGroup: string }) {

        commit(context, M.DELETE_RECORD_ID_FROM_GROUP_NODE, { node: sourcePerson.node, id: sourcePerson.id });
        commit(context, M.INSERT_RECORD_ID_TO_GROUP_NODE, { node: targetGroup, id: sourcePerson.id });
    },

    async [A.SWAP_RECORDS](context: Context, { personA, personB }: { personA: { node: string, id: RecordElement }, personB: { node: string, id: RecordElement } }) {
        // Only permit unique IDs to be swapped
        if (personA.id === personB.id) {
            throw new Error("Only two unique records can be swapped");
        }

        commit(context, M.DELETE_RECORD_ID_FROM_GROUP_NODE, { node: personA.node, id: personA.id });
        commit(context, M.DELETE_RECORD_ID_FROM_GROUP_NODE, { node: personB.node, id: personB.id });

        commit(context, M.INSERT_RECORD_ID_TO_GROUP_NODE, { node: personB.node, id: personA.id });
        commit(context, M.INSERT_RECORD_ID_TO_GROUP_NODE, { node: personA.node, id: personB.id });
    },
};

export function init() {
    return actions as ActionTree<State, State>;
}
