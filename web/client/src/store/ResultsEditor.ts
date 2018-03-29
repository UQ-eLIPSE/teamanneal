import { Module } from "vuex";
import { RecordData } from "../data/RecordData";
import { StrataConfig } from "../data/StrataConfig";
import { ConstraintConfig } from "../data/ConstraintConfig";
import { GroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeStructure } from "../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";

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

        strataConfig: {
            strata: [],
        },

        groupNode: {
            structure: {
                roots: [],
            },
            nameMap: {},
            nodeRecordArrayMap: {},
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

    groupNode: {
        /** Current tree encoding the structure of how groups are assigned */
        structure: GroupNodeStructure,
        /** Map for group nodes to their names */
        nameMap: GroupNodeNameMap,
        /** Group node records */
        nodeRecordArrayMap: GroupNodeRecordArrayMap,
    },

    // NOTE: `namingConfig` is NOT to be used; this is here to only indicate
    // what was previously once integrated into the `AnnealConfig` megaobject
    // and has been since broken up
    //
    // TODO: Remove this upon full state migration
    /** @deprecated */
    namingConfig: undefined,
}
