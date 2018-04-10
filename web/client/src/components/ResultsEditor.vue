<template>
    <div class="results-editor">
        <div class="workspace">
            <SpreadsheetTreeView2 class="spreadsheet"
                                  :nodeRoots="nodeRoots"
                                  :headerRow="headerRow"
                                  :recordRows="recordRows"
                                  :nodeNameMap="nameMap"
                                  :nodeRecordMap="nodeRecordMap"
                                  :nodeStyles="nodeStyles"
                                  :idColumnIndex="idColumnIndex"
                                  @itemClick="onItemClickHandler"></SpreadsheetTreeView2>
        </div>
        <ResultsEditorSideToolArea class="side-tool-area"></ResultsEditorSideToolArea>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import * as Store from "../store";

import { GroupNode } from "../data/GroupNode";
import { ColumnData } from "../data/ColumnData";

import { RecordElement } from "../../../common/Record";

import SpreadsheetTreeView2 from "./SpreadsheetTreeView2.vue";
import ResultsEditorSideToolArea from "./ResultsEditorSideToolArea.vue";

@Component({
    components: {
        SpreadsheetTreeView2,
        ResultsEditorSideToolArea,
    },
})
export default class ResultsEditor extends Vue {
    /** New reference to module state */
    get state() {
        return Store.ResultsEditor.state;
    }

    get recordData() {
        return this.state.recordData;
    }

    get columns() {
        return this.recordData.columns;
    }

    get strata() {
        return this.state.strataConfig.strata;
    }

    get nodeRoots() {
        return this.state.groupNode.structure.roots;
    }

    get nodeRecordMap() {
        return this.state.groupNode.nodeRecordArrayMap;
    }

    get partitionColumn() {
        const partitionColumnDesc = this.recordData.partitionColumn;

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
        return this.state.groupNode.nameMap;
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

    /** A map of nodes or records which are to be styled in the spreadsheet */
    get nodeStyles() {
        // // We currently only style things being edited
        // const op = this.pendingEditOperation;

        // if (op === undefined) {
        //     return undefined;
        // }

        // // TODO: Proper UI design for this feature
        // const nodeStyles: Map<AnnealNode.Node | RecordElement, { color?: string, backgroundColor?: string }> = new Map();

        // switch (op.type) {
        //     case "move-record": {
        //         if (op.from !== undefined) {
        //             nodeStyles.set(op.from.recordId, { color: "#fff", backgroundColor: "#49075e" });
        //         }

        //         if (op.to !== undefined) {
        //             nodeStyles.set(op.to.path[op.to.path.length - 1], { color: "#fff", backgroundColor: "#000" });
        //         }

        //         return nodeStyles;
        //     }

        //     case "swap-records": {
        //         if (op.recordA !== undefined) {
        //             nodeStyles.set(op.recordA.recordId, { color: "#fff", backgroundColor: "#49075e" });
        //         }

        //         if (op.recordB !== undefined) {
        //             nodeStyles.set(op.recordB.recordId, { color: "#fff", backgroundColor: "#49075e" });
        //         }

        //         return nodeStyles;
        //     }
        // }
        return new Map();
    }

    // onConstraintSelected(constraint: IConstraint) {
    //     // Set the selected constraint when the previous value is undefined
    //     if (this.selectedConstraint === undefined) {
    //         this.selectedConstraint = constraint;
    //         return;
    //     }

    //     // Unset selected constraint if constraint selected again
    //     if (this.selectedConstraint._id === constraint._id) {
    //         this.selectedConstraint = undefined;
    //         return;
    //     }

    //     // Otherwise, overwrite the value of the selected constraint
    //     this.selectedConstraint = constraint;
    // }

    onItemClickHandler(_data: ({ node: GroupNode } | { recordId: RecordElement })[]) {
        // // Only continue if we're in an editing operation
        // if (this.pendingEditOperation === undefined) {
        //     return;
        // }

        // // Each operation type has different behaviours
        // const op = this.pendingEditOperation;

        // switch (op.type) {
        //     case "move-record": {
        //         switch (op.cursor) {
        //             case "from": {
        //                 // TODO: Fix type narrowing
        //                 const targetItem: any = data[data.length - 1];

        //                 // Can only move records
        //                 if (targetItem.recordId === undefined) {
        //                     return;
        //                 }

        //                 // Split array, with the assumption that record only
        //                 // appears at end once
        //                 const recordId: RecordElement = targetItem.recordId;
        //                 const targetPath = (data.slice(0, -1) as { node: AnnealNode.Node }[]).map(item => item.node);

        //                 // Set operation path and cursor
        //                 op.from = {
        //                     path: targetPath,
        //                     recordId,
        //                 };

        //                 // Move cursor to "to" if `to` not filled in
        //                 if (op.to === undefined) {
        //                     op.cursor = "to";
        //                 } else {
        //                     op.cursor = undefined;
        //                 }

        //                 return;
        //             }

        //             case "to": {
        //                 // Get the lowest stratum selected
        //                 const targetNodeReversedIndex = [...data].reverse().findIndex((item: any) => item.node !== undefined);
        //                 const arrayCopyLength = (targetNodeReversedIndex === -1) ? data.length : data.length - targetNodeReversedIndex;
        //                 // TODO: Fix type narrowing
        //                 const targetPath = (data.slice(0, arrayCopyLength) as { node: AnnealNode.Node }[]).map(item => item.node);
        //                 const targetNode = targetPath[targetPath.length - 1];

        //                 // Can only move records to other "stratum-records"
        //                 if (targetNode.type !== "stratum-records") {
        //                     return;
        //                 }

        //                 // Set operation path and cursor
        //                 op.to = {
        //                     path: targetPath,
        //                 };

        //                 op.cursor = undefined;

        //                 return;
        //             }
        //         }
        //         return;
        //     }

        //     case "swap-records": {
        //         switch (op.cursor) {
        //             case "recordA": {
        //                 // TODO: Fix type narrowing
        //                 const targetItem: any = data[data.length - 1];

        //                 // Can only move records
        //                 if (targetItem.recordId === undefined) {
        //                     return;
        //                 }

        //                 // Split array, with the assumption that record only
        //                 // appears at end once
        //                 const recordId: RecordElement = targetItem.recordId;
        //                 const targetPath = (data.slice(0, -1) as { node: AnnealNode.Node }[]).map(item => item.node);

        //                 // Set operation path and cursor
        //                 op.recordA = {
        //                     path: targetPath,
        //                     recordId,
        //                 };

        //                 // Move cursor to "recordB" if `recordB` not filled in
        //                 if (op.recordB === undefined) {
        //                     op.cursor = "recordB";
        //                 } else {
        //                     op.cursor = undefined;
        //                 }

        //                 return;
        //             }

        //             case "recordB": {
        //                 // TODO: Fix type narrowing
        //                 const targetItem: any = data[data.length - 1];

        //                 // Can only move records
        //                 if (targetItem.recordId === undefined) {
        //                     return;
        //                 }

        //                 // Split array, with the assumption that record only
        //                 // appears at end once
        //                 const recordId: RecordElement = targetItem.recordId;
        //                 const targetPath = (data.slice(0, -1) as { node: AnnealNode.Node }[]).map(item => item.node);

        //                 // Set operation path and cursor
        //                 op.recordB = {
        //                     path: targetPath,
        //                     recordId,
        //                 };

        //                 op.cursor = undefined;

        //                 return;
        //             }
        //         }
        //         return;
        //     }
        // }
    }

    // TODO: Correct `keyof` type for the operation type parameter
    onSelectEditOperation(_operationType: string) {
        // switch (operationType) {
        //     case "move-record": {
        //         this.pendingEditOperation = {
        //             type: "move-record",
        //             cursor: "from",
        //             from: undefined,
        //             to: undefined,
        //         };

        //         return;
        //     }

        //     case "swap-records": {
        //         this.pendingEditOperation = {
        //             type: "swap-records",
        //             cursor: "recordA",
        //             recordA: undefined,
        //             recordB: undefined,
        //         };

        //         break;
        //     }
        // }
    }

    // onCancelEditOperation() {
    //     this.pendingEditOperation = undefined;
    // }

    onCommitEditOperation() {
        // // Perform the edit operation
        // const op = this.pendingEditOperation;

        // if (op === undefined) {
        //     return;
        // }

        // switch (op.type) {
        //     case "move-record": {
        //         // Invalid state for commit
        //         if (op.from === undefined || op.to === undefined) {
        //             throw new Error("Not enough information provided for move operation");
        //         }

        //         const from = op.from;
        //         const fromPath = from.path;
        //         const fromNode = fromPath[fromPath.length - 1];

        //         const movedRecordId = from.recordId;

        //         if (fromNode.type !== "stratum-records") {
        //             throw new Error("'From node' is not a record carrying stratum");
        //         }

        //         const to = op.to;
        //         const toPath = to.path;
        //         const toNode = toPath[toPath.length - 1];

        //         if (toNode.type !== "stratum-records") {
        //             throw new Error("'To node' is not a record carrying stratum");
        //         }

        //         // TODO: Fix type `any`
        //         // This is due to nodes being typed as being purely read-only
        //         // for safety, but this prevents us from being able to modify 
        //         // the node information as required here, unless we do a full
        //         // recreation of the tree
        //         (fromNode as any).recordIds = fromNode.recordIds.filter(x => x !== movedRecordId);
        //         (toNode as any).recordIds = [...toNode.recordIds, movedRecordId];

        //         break;
        //     }

        //     case "swap-records": {
        //         // Invalid state for commit
        //         if (op.recordA === undefined || op.recordB === undefined) {
        //             throw new Error("Not enough information provided for swap operation");
        //         }

        //         const { recordA, recordB } = op;

        //         const recordAPath = recordA.path;
        //         const recordANode = recordAPath[recordAPath.length - 1];
        //         const recordAId = recordA.recordId;

        //         if (recordANode.type !== "stratum-records") {
        //             throw new Error("'Record A node' is not a record carrying stratum");
        //         }

        //         const recordAIndex = recordANode.recordIds.indexOf(recordAId);

        //         if (recordAIndex === -1) {
        //             throw new Error("'Record A node' not found");
        //         }

        //         const recordBPath = recordB.path;
        //         const recordBNode = recordBPath[recordAPath.length - 1];
        //         const recordBId = recordB.recordId;

        //         if (recordBNode.type !== "stratum-records") {
        //             throw new Error("'Record B node' is not a record carrying stratum");
        //         }

        //         const recordBIndex = recordBNode.recordIds.indexOf(recordBId);

        //         if (recordBIndex === -1) {
        //             throw new Error("'Record B node' not found");
        //         }

        //         // TODO: Fix type `any`
        //         // This is due to nodes being typed as being purely read-only
        //         // for safety, but this prevents us from being able to modify 
        //         // the node information as required here, unless we do a full
        //         // recreation of the tree
        //         (recordANode as any).recordIds[recordAIndex] = recordBId;
        //         (recordBNode as any).recordIds[recordBIndex] = recordAId;

        //         break;
        //     }
        // }

        // // Clear the pending edit operation now that we're done
        // this.pendingEditOperation = undefined;
    }

    onEditOperationCursorChange(_cursor: string | undefined) {
        // if (this.pendingEditOperation === undefined) {
        //     return;
        // }

        // // TODO: Fix type narrowing
        // this.pendingEditOperation.cursor = cursor as any;
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

.side-tool-area {
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
