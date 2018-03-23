<template>
    <div class="results-editor">
        <div class="workspace">
            <SpreadsheetTreeView2 class="spreadsheet"
                                  :annealNodeRoots="modifiedAnnealNodeRoots"
                                  :constraintSatisfactionMap="nodeToOverallSatisfactionMap"
                                  :headerRow="headerRow"
                                  :recordRows="recordRows"
                                  :nodeNameMap="nameMap"
                                  :nodeStyles="nodeStyles"
                                  :idColumnIndex="idColumnIndex"
                                  @itemClick="onItemClickHandler"></SpreadsheetTreeView2>
        </div>
        <div class="menu">Menu</div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle } from "av-ts";

import * as ToClientAnnealResponse from "../../../common/ToClientAnnealResponse";

import { ColumnData } from "../data/ColumnData";
import { ResultTree } from "../data/ResultTree";
import { AxiosResponse } from "../data/AnnealResponse";
import { Data as IConstraint } from "../data/Constraint";

import { RecordElement } from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";

import SpreadsheetTreeView2 from "./SpreadsheetTreeView2.vue";

@Component({
    components: {
        SpreadsheetTreeView2,
    },
})
export default class ResultsEditor extends Vue {
    /**
     * Holds a new deep copy of the annealed nodes that may be modified by the 
     * user
     */
    modifiedAnnealNodeRoots: AnnealNode.NodeRoot[] | undefined = undefined;

    get columns() {
        return this.state.recordData.columns;
    }

    get strata() {
        return this.state.annealConfig.strata;
    }

    get constraints() {
        return this.state.annealConfig.constraints.reduce<{ [constraintId: string]: IConstraint | undefined }>((cObj, constraint) => {
            cObj[constraint._id] = constraint;
            return cObj;
        }, {});
    }

    get partitionColumn() {
        const partitionColumnDesc = this.state.recordData.partitionColumn;

        if (partitionColumnDesc === undefined) {
            return undefined;
        }

        return ColumnData.ConvertToDataObject(this.columns, partitionColumnDesc);
    }

    get headerRow() {
        return this.columns.map(col => col.label);
    }

    get recordRows() {
        return ColumnData.TransposeIntoCookedValueRowArray(this.columns);
    }

    get nameMap() {
        if (this.modifiedAnnealNodeRoots === undefined) {
            return undefined;
        }

        return ResultTree.GenerateNodeNameMap(this.strata, this.partitionColumn, this.modifiedAnnealNodeRoots);
    }

    get idColumn() {
        const idColumnDesc = this.state.recordData.idColumn;

        if (idColumnDesc === undefined) {
            throw new Error("No ID column set");
        }

        const idColumn = this.columns.find(col => ColumnData.Equals(idColumnDesc, col));

        if (idColumn === undefined) {
            throw new Error("No ID column set");
        }

        return idColumn;
    }

    get idColumnIndex() {
        const idColumn = this.idColumn;
        const idColumnIndex = this.columns.indexOf(idColumn);

        return idColumnIndex;
    }

    get annealResults() {
        const responseContent = this.state.annealResponse!.content as AxiosResponse;
        const responseData = responseContent.data as ToClientAnnealResponse.Root;

        // We're working on the presumption that we definitely have results
        return responseData.results!;
    }

    get annealSatisfactionMap() {
        return this.annealResults
            .map(res => res.result!.satisfaction)
            .reduce((carry, sMap) => Object.assign(carry, sMap), {});
    }

    get nodeToOverallSatisfactionMap() {
        const asMap = this.annealSatisfactionMap;

        return Object.keys(asMap)
            .reduce<{ [nodeId: string]: number | undefined }>((mapObj, nodeId) => {
                // Satisfaction of constraints for this node
                const nodeSatisfactionObject = asMap[nodeId];

                let constraintIds = Object.keys(nodeSatisfactionObject);

                // If there is a selected constraint, then only generate the 
                // satisfaction map with that constraint
                if (this.selectedConstraint !== undefined) {
                    const selectedConstraintId = this.selectedConstraint._id;
                    constraintIds = constraintIds.filter(constraintId => selectedConstraintId === constraintId);
                }

                // If there are no constraints to apply, then there is nothing 
                // to add to the object
                if (constraintIds.length === 0) {
                    return mapObj;
                }

                // Do a weighted satisfaction sum scaled to [0,1]
                const satisfaction = constraintIds.reduce<[number, number]>((satTuple, constraintId) => {
                    const constraint = this.constraints[constraintId];

                    if (constraint === undefined) {
                        throw new Error("Constraint not found");
                    }

                    const constraintWeight = constraint.weight;

                    // 0th index = sum of (weight * raw satisfaction)
                    satTuple[0] += constraintWeight * (nodeSatisfactionObject[constraintId] || 0);

                    // 1th index = sum of weights
                    satTuple[1] += constraintWeight;

                    return satTuple;
                }, [0, 0]);

                // Assign overall satisfaction to node ID
                mapObj[nodeId] = satisfaction[0] / satisfaction[1];

                return mapObj;
            }, {});
    }

    /** A map of nodes or records which are to be styled in the spreadsheet */
    get nodeStyles() {
        // We currently only style things being edited
        const op = this.pendingEditOperation;

        if (op === undefined) {
            return undefined;
        }

        // TODO: Proper UI design for this feature
        const nodeStyles: Map<AnnealNode.Node | RecordElement, { color?: string, backgroundColor?: string }> = new Map();

        switch (op.type) {
            case "move-record": {
                if (op.from !== undefined) {
                    nodeStyles.set(op.from.recordId, { color: "#fff", backgroundColor: "#49075e" });
                }

                if (op.to !== undefined) {
                    nodeStyles.set(op.to.path[op.to.path.length - 1], { color: "#fff", backgroundColor: "#000" });
                }

                return nodeStyles;
            }

            case "swap-records": {
                if (op.recordA !== undefined) {
                    nodeStyles.set(op.recordA.recordId, { color: "#fff", backgroundColor: "#49075e" });
                }

                if (op.recordB !== undefined) {
                    nodeStyles.set(op.recordB.recordId, { color: "#fff", backgroundColor: "#49075e" });
                }

                return nodeStyles;
            }
        }
    }

    onConstraintSelected(constraint: IConstraint) {
        // Set the selected constraint when the previous value is undefined
        if (this.selectedConstraint === undefined) {
            this.selectedConstraint = constraint;
            return;
        }

        // Unset selected constraint if constraint selected again
        if (this.selectedConstraint._id === constraint._id) {
            this.selectedConstraint = undefined;
            return;
        }

        // Otherwise, overwrite the value of the selected constraint
        this.selectedConstraint = constraint;
    }

    onItemClickHandler(data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) {
        // Only continue if we're in an editing operation
        if (this.pendingEditOperation === undefined) {
            return;
        }

        // Each operation type has different behaviours
        const op = this.pendingEditOperation;

        switch (op.type) {
            case "move-record": {
                switch (op.cursor) {
                    case "from": {
                        // TODO: Fix type narrowing
                        const targetItem: any = data[data.length - 1];

                        // Can only move records
                        if (targetItem.recordId === undefined) {
                            return;
                        }

                        // Split array, with the assumption that record only
                        // appears at end once
                        const recordId: RecordElement = targetItem.recordId;
                        const targetPath = (data.slice(0, -1) as { node: AnnealNode.Node }[]).map(item => item.node);

                        // Set operation path and cursor
                        op.from = {
                            path: targetPath,
                            recordId,
                        };

                        // Move cursor to "to" if `to` not filled in
                        if (op.to === undefined) {
                            op.cursor = "to";
                        } else {
                            op.cursor = undefined;
                        }

                        return;
                    }

                    case "to": {
                        // Get the lowest stratum selected
                        const targetNodeReversedIndex = [...data].reverse().findIndex((item: any) => item.node !== undefined);
                        const arrayCopyLength = (targetNodeReversedIndex === -1) ? data.length : data.length - targetNodeReversedIndex;
                        // TODO: Fix type narrowing
                        const targetPath = (data.slice(0, arrayCopyLength) as { node: AnnealNode.Node }[]).map(item => item.node);
                        const targetNode = targetPath[targetPath.length - 1];

                        // Can only move records to other "stratum-records"
                        if (targetNode.type !== "stratum-records") {
                            return;
                        }

                        // Set operation path and cursor
                        op.to = {
                            path: targetPath,
                        };

                        op.cursor = undefined;

                        return;
                    }
                }
                return;
            }

            case "swap-records": {
                switch (op.cursor) {
                    case "recordA": {
                        // TODO: Fix type narrowing
                        const targetItem: any = data[data.length - 1];

                        // Can only move records
                        if (targetItem.recordId === undefined) {
                            return;
                        }

                        // Split array, with the assumption that record only
                        // appears at end once
                        const recordId: RecordElement = targetItem.recordId;
                        const targetPath = (data.slice(0, -1) as { node: AnnealNode.Node }[]).map(item => item.node);

                        // Set operation path and cursor
                        op.recordA = {
                            path: targetPath,
                            recordId,
                        };

                        // Move cursor to "recordB" if `recordB` not filled in
                        if (op.recordB === undefined) {
                            op.cursor = "recordB";
                        } else {
                            op.cursor = undefined;
                        }

                        return;
                    }

                    case "recordB": {
                        // TODO: Fix type narrowing
                        const targetItem: any = data[data.length - 1];

                        // Can only move records
                        if (targetItem.recordId === undefined) {
                            return;
                        }

                        // Split array, with the assumption that record only
                        // appears at end once
                        const recordId: RecordElement = targetItem.recordId;
                        const targetPath = (data.slice(0, -1) as { node: AnnealNode.Node }[]).map(item => item.node);

                        // Set operation path and cursor
                        op.recordB = {
                            path: targetPath,
                            recordId,
                        };

                        op.cursor = undefined;

                        return;
                    }
                }
                return;
            }
        }
    }

    // TODO: Correct `keyof` type for the operation type parameter
    onSelectEditOperation(operationType: string) {
        switch (operationType) {
            case "move-record": {
                this.pendingEditOperation = {
                    type: "move-record",
                    cursor: "from",
                    from: undefined,
                    to: undefined,
                };

                return;
            }

            case "swap-records": {
                this.pendingEditOperation = {
                    type: "swap-records",
                    cursor: "recordA",
                    recordA: undefined,
                    recordB: undefined,
                };

                break;
            }
        }
    }

    onCancelEditOperation() {
        this.pendingEditOperation = undefined;
    }

    onCommitEditOperation() {
        // Perform the edit operation
        const op = this.pendingEditOperation;

        if (op === undefined) {
            return;
        }

        switch (op.type) {
            case "move-record": {
                // Invalid state for commit
                if (op.from === undefined || op.to === undefined) {
                    throw new Error("Not enough information provided for move operation");
                }

                const from = op.from;
                const fromPath = from.path;
                const fromNode = fromPath[fromPath.length - 1];

                const movedRecordId = from.recordId;

                if (fromNode.type !== "stratum-records") {
                    throw new Error("'From node' is not a record carrying stratum");
                }

                const to = op.to;
                const toPath = to.path;
                const toNode = toPath[toPath.length - 1];

                if (toNode.type !== "stratum-records") {
                    throw new Error("'To node' is not a record carrying stratum");
                }

                // TODO: Fix type `any`
                // This is due to nodes being typed as being purely read-only
                // for safety, but this prevents us from being able to modify 
                // the node information as required here, unless we do a full
                // recreation of the tree
                (fromNode as any).recordIds = fromNode.recordIds.filter(x => x !== movedRecordId);
                (toNode as any).recordIds = [...toNode.recordIds, movedRecordId];

                break;
            }

            case "swap-records": {
                // Invalid state for commit
                if (op.recordA === undefined || op.recordB === undefined) {
                    throw new Error("Not enough information provided for swap operation");
                }

                const { recordA, recordB } = op;

                const recordAPath = recordA.path;
                const recordANode = recordAPath[recordAPath.length - 1];
                const recordAId = recordA.recordId;

                if (recordANode.type !== "stratum-records") {
                    throw new Error("'Record A node' is not a record carrying stratum");
                }

                const recordAIndex = recordANode.recordIds.indexOf(recordAId);

                if (recordAIndex === -1) {
                    throw new Error("'Record A node' not found");
                }

                const recordBPath = recordB.path;
                const recordBNode = recordBPath[recordAPath.length - 1];
                const recordBId = recordB.recordId;

                if (recordBNode.type !== "stratum-records") {
                    throw new Error("'Record B node' is not a record carrying stratum");
                }

                const recordBIndex = recordBNode.recordIds.indexOf(recordBId);

                if (recordBIndex === -1) {
                    throw new Error("'Record B node' not found");
                }

                // TODO: Fix type `any`
                // This is due to nodes being typed as being purely read-only
                // for safety, but this prevents us from being able to modify 
                // the node information as required here, unless we do a full
                // recreation of the tree
                (recordANode as any).recordIds[recordAIndex] = recordBId;
                (recordBNode as any).recordIds[recordBIndex] = recordAId;

                break;
            }
        }

        // Clear the pending edit operation now that we're done
        this.pendingEditOperation = undefined;
    }

    onEditOperationCursorChange(cursor: string | undefined) {
        if (this.pendingEditOperation === undefined) {
            return;
        }

        // TODO: Fix type narrowing
        this.pendingEditOperation.cursor = cursor as any;
    }

    @Lifecycle created() {
        // Copy out the data from the state so that modifications are separate 
        // from the anneal result which is consistent with constraints
        //
        // This is NOT persistent - if you leave this component, the changes you
        // made will disappear
        //
        // TODO: This needs some persistence of some sort but this will heavily
        // depend on how we will be managing the data
        this.modifiedAnnealNodeRoots = JSON.parse(JSON.stringify(this.annealResults.map(res => res.result!.tree)));
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.results-editor {
    display: flex;

    position: absolute;

    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.workspace {
    flex-grow: 1;
    background: #fff;
    position: relative;
}

.menu {
    flex-grow: 0;
    flex-shrink: 0;
}

.spreadsheet {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
</style>
