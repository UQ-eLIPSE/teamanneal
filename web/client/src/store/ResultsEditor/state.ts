import { RecordData, init as initRecordData } from "../../data/RecordData";
import { StrataConfig, init as initStrataConfig } from "../../data/StrataConfig";
import { ConstraintConfig, init as initConstraintConfig } from "../../data/ConstraintConfig";
import { GroupNodeNameMap, init as initGroupNodeNameMap } from "../../data/GroupNodeNameMap";
import { GroupNodeStructure, init as initGroupNodeStructure } from "../../data/GroupNodeStructure";
import { GroupNodeRecordArrayMap, init as initGroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";
import { MutationTracker } from "../../data/MutationTracker";
import { SidePanelActiveTool } from "../../data/SidePanelActiveTool";

import { AnnealCreatorStateSerialisable } from "../AnnealCreator/state";
import * as ConstraintSatisfaction from "../../../../common/ConstraintSatisfaction";


export interface ResultsEditorState extends AnnealCreatorStateSerialisable {
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
    },

    requestDepth: number,

    requestIdJump: string,

    /** Stores `node` ids of nodes which were collapsed.   */
    collapsedNodes: { [key: string]: true },

    annealFlags?: MutationTracker,
    satisfaction: ConstraintSatisfaction.SatisfactionState
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
        },

        requestDepth: 0,

        requestIdJump: "",

        /** Stores `node` ids of nodes which were collapsed (hidden).   */
        collapsedNodes: {},

        // Doesn't need to keep track of the flags
        satisfaction: ConstraintSatisfaction.initConstraintSatisfactionState()
    };

    return state;
}
