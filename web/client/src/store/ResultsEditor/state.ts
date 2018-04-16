import { RecordData, initNew as initRecordData } from "../../data/RecordData";
import { StrataConfig, initNew as initStrataConfig } from "../../data/StrataConfig";
import { ConstraintConfig, initNew as initConstraintConfig } from "../../data/ConstraintConfig";
import { GroupNodeNameMap, initNew as initGroupNodeNameMap } from "../../data/GroupNodeNameMap";
import { GroupNodeStructure, initNew as initGroupNodeStructure } from "../../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap, initNew as initGroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";
import { SidePanelActiveTool } from "../../data/SidePanelActiveTool";

export interface ResultsEditorState {
    /** Data for each leaf node in the group tree (individual records) */
    recordData: RecordData,

    /** Object containing all constraints used */
    constraintConfig: ConstraintConfig,

    /** Configuration of strata  */
    strataConfig: StrataConfig,

    groupNode: {
        /** Current tree encoding the structure of how groups are assigned */
        structure: GroupNodeStructure,

        /** Map for group nodes to their names */
        nameMap: GroupNodeNameMap,

        /** Group node records */
        nodeRecordArrayMap: GroupNodeRecordArrayMap,
    },

    sideToolArea: {
        /** Information about the active side tool item */
        activeItem: SidePanelActiveTool | undefined,
    }
}

export function init() {
    const state: ResultsEditorState = {
        recordData: initRecordData(),

        constraintConfig: initConstraintConfig(),

        strataConfig: initStrataConfig(),

        groupNode: {
            structure: initGroupNodeStructure(),
            nameMap: initGroupNodeNameMap(),
            nodeRecordArrayMap: initGroupNodeRecordArrayMap(),
        },

        sideToolArea: {
            activeItem: undefined,
        }
    };

    return state;
}
