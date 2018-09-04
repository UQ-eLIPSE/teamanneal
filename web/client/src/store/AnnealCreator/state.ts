import * as AnnealRequestState from "../../data/AnnealRequestState";
import * as AnnealResponse from "../../data/AnnealResponse";

import { RecordData, init as initRecordData } from "../../data/RecordData";
import { StrataConfig, init as initStrataConfig } from "../../data/StrataConfig";
import { ConstraintConfig, init as initConstraintConfig } from "../../data/ConstraintConfig";

import { ResultTree } from "../../data/ResultTree";
import { ColumnData } from "../../data/ColumnData";
import { GroupNode } from "../../data/GroupNode";
import { GroupNodeRoot } from "../../data/GroupNodeRoot";
import { GroupNodeNameMap } from "../../data/GroupNodeNameMap";
import { GroupNodeLeafStratum } from "../../data/GroupNodeLeafStratum";
import { GroupNodeRecordArrayMap } from "../../data/GroupNodeRecordArrayMap";
import { GroupNodeIntermediateStratum } from "../../data/GroupNodeIntermediateStratum";
import { MutationTracker, init as initMutationTracker } from "../../data/MutationTracker";

import * as AnnealNode from "../../../../common/AnnealNode";

export interface AnnealCreatorStateSerialisable {
    /** Data for each leaf node in the group tree (individual records) */
    recordData: RecordData,

    /** Object containing all constraints used */
    constraintConfig: ConstraintConfig,

    /** Configuration of strata  */
    strataConfig: StrataConfig,

    // Placeholder possible property
    annealRequest?: AnnealRequestState.AnnealRequestState,

    /** Keeps track of user changes */
    annealFlags?: MutationTracker
}

export interface AnnealCreatorState extends AnnealCreatorStateSerialisable {
    /** Anneal request/response information */
    annealRequest: AnnealRequestState.AnnealRequestState,
}

export function init() {
    const state: AnnealCreatorState = {
        recordData: initRecordData(),

        constraintConfig: initConstraintConfig(),

        strataConfig: initStrataConfig(),

        annealRequest: AnnealRequestState.initNotRunning(),
        
        annealFlags: initMutationTracker()
    };

    return state;
}

export function generateGroupNodeCompatibleData(state: AnnealCreatorState) {
    // Incoming state must be such that it has an anneal response
    if (!(AnnealRequestState.isCompleted(state.annealRequest) &&
        AnnealResponse.isSuccess(state.annealRequest.response))) {
        throw new Error("AnnealCreator state does not have usable response data to generate group node compatible data");
    }

    // Generate names as configured in anneal creator
    const annealRequest = state.annealRequest as AnnealRequestState.AnnealRequestProgress_Completed;
    const response = annealRequest.response as AnnealResponse.AnnealResponse_ContentSuccess;
    const data = response.data;

    if (data === undefined) {
        throw new Error("No anneal response data in AnnealCreator state");
    }

    if (data.results === undefined) {
        throw new Error("No results available in AnnealCreator state");
    }

    // NOTE: Assumes results and no errors are in the tree
    const annealNodeRoots = data.results.map(res => res.result!.tree);

    // Grab full partition column data
    const _partitionColumn = state.recordData.partitionColumn;
    const partitionColumn = _partitionColumn === undefined ? undefined : ColumnData.ConvertToDataObject(state.recordData.source.columns, _partitionColumn);

    // Walk the tree and decompose data
    const nameMap = ResultTree.GenerateNodeNameMap(state.strataConfig, partitionColumn, annealNodeRoots);
    const newRoots: GroupNodeRoot[] = [];
    const newNameMap: GroupNodeNameMap = {};
    const newNodeRecordArrayMap: GroupNodeRecordArrayMap = {};

    const walkAnnealTreeAndTransform = (node: AnnealNode.Node): GroupNode => {
        const nodeId = node._id;
        const nameInfo = nameMap.get(node)!;

        switch (node.type) {
            case "root": {
                const newRoot: GroupNodeRoot = {
                    _id: nodeId,
                    type: "root",
                    children: node.children.map(walkAnnealTreeAndTransform) as (GroupNodeIntermediateStratum | GroupNodeLeafStratum)[],
                };

                // Push root, name
                newRoots.push(newRoot);
                newNameMap[nodeId] = `${nameInfo.stratumLabel} ${nameInfo.nodeGeneratedName}`;

                return newRoot;
            }

            case "stratum-stratum": {
                const newIntStrNode: GroupNodeIntermediateStratum = {
                    _id: nodeId,
                    type: "intermediate-stratum",
                    children: node.children.map(walkAnnealTreeAndTransform) as (GroupNodeIntermediateStratum | GroupNodeLeafStratum)[],
                };

                // Push name
                newNameMap[nodeId] = `${nameInfo.stratumLabel} ${nameInfo.nodeGeneratedName}`;

                return newIntStrNode;
            }

            case "stratum-records": {
                const newLeafStrNode: GroupNodeLeafStratum = {
                    _id: nodeId,
                    type: "leaf-stratum",
                };

                // Push name, records
                newNameMap[nodeId] = `${nameInfo.stratumLabel} ${nameInfo.nodeGeneratedName}`;
                newNodeRecordArrayMap[nodeId] = [...node.recordIds];

                return newLeafStrNode;
            }
        }
    }

    annealNodeRoots.forEach(walkAnnealTreeAndTransform);

    return {
        roots: newRoots,
        nameMap: newNameMap,
        nodeRecordArrayMap: newNodeRecordArrayMap,
    };
}
