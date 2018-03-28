import { Module } from "vuex";
import { RecordData } from "../data/RecordData";
import { StrataConfig } from "../data/StrataConfig";
import { GroupStructure } from "../data/GroupStructure";
import { ConstraintConfig } from "../data/ConstraintConfig";

export const ResultsEditor = (namespaced: boolean = true) => {
    const stateModule: Module<State, State> = {
        namespaced,

        // We provide an init function so that a new object will be instantiated
        // with each module generated
        state: InitState,
    };

    return stateModule;
}

function InitState() {
    const state: State = {
        recordData: {
            source: {
                name: undefined,
                length: 0,
            },
            columns: [],
            idColumn: undefined,
            partitionColumn: undefined,
        },

        constraintConfig: {
            constraints: [],
        },

        groupStructure: [],

        strataConfig: {
            strata: [],
        },

        namingConfig: undefined,
    };

    return state;
}

export interface State {
    /** Data for each leaf node in the group tree (individual records) */
    recordData: RecordData,
    /** Object containing all constraints used */
    constraintConfig: ConstraintConfig,
    /** Configuration of  */
    strataConfig: StrataConfig,
    /** Current tree encoding the structure of how groups are assigned */
    groupStructure: GroupStructure,

    // NOTE: `namingConfig` is NOT to be used; this is here to only indicate
    // what was previously once integrated into the `AnnealConfig` megaobject
    // and has been since broken up
    //
    // TODO: Remove this upon full state migration
    /** @deprecated */
    namingConfig: undefined,
}
