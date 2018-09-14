<template>
    <div class="results-editor">
        <div class="workspace"
             v-if="displayWorkspace">
            <SpreadsheetTreeView2ColumnsFilter :items="columns"
                                               :selectedIndices="columnsDisplayIndices"
                                               @listUpdated="visibleColumnListUpdateHandler"></SpreadsheetTreeView2ColumnsFilter>

            <SpreadsheetTreeView2 class="spreadsheet"
                                  :nodeRoots="nodeRoots"
                                  :headerRow="headerRow"
                                  :columnsDisplayIndices="columnsDisplayIndices"
                                  :recordRows="recordRows"
                                  :nodeNameMap="nameMap"
                                  :nodeRecordMap="nodeRecordMap"
                                  :nodeStyles="nodeStyles"
                                  :idColumnIndex="idColumnIndex"
                                  :hiddenNodes="hiddenNodes"
                                  :onToggleNodeVisibility="onToggleNodeVisibility"
                                  @itemClick="onItemClickHandler"></SpreadsheetTreeView2>
        </div>
        <div class="get-started"
             v-else>
            <h1>Welcome</h1>
            <p>The TeamAnneal Editor allows you to view and modify groups generated from the anneal process.</p>
            <p>Get started by obtaining group data from
                <router-link :to="'anneal'">running an anneal</router-link>, or
                <a href="#import-results-package-file"
                   @click.prevent="openImportSidePanel">importing a TeamAnneal results package file</a>.</p>
        </div>

        <ConstraintOverview v-if="displayWorkspace" class="constraint-overview" :constraints="constraintsArray" :limitConstraintStatistics="annealStratumStatistics" :constraintSatisfactionMap="annealSatisfactionMap" :strata="strata">
        </ConstraintOverview>

        <ResultsEditorSideToolArea class="side-tool-area"
                                   :menuItems="menuBarItems"></ResultsEditorSideToolArea>
    <!-- </div>
    <ResultsEditorSideToolArea class="side-tool-area" :menuItems="menuBarItems"></ResultsEditorSideToolArea> -->
  </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { ResultsEditor as S, AnnealCreator as S_AnnealCreator } from "../store";

import { GroupNode } from "../data/GroupNode";
import { ColumnData } from "../data/ColumnData";
import { MenuItem } from "../data/ResultsEditorMenuBar";
import { MoveSidePanelToolData } from "../data/MoveSidePanelToolData";
import { SwapSidePanelToolData } from "../data/SwapSidePanelToolData";

import { Record, RecordElement } from "../../../common/Record";

// import { LimitConstraintSatisfaction } from "../data/Constraint";
import SpreadsheetTreeView2 from "./SpreadsheetTreeView2.vue";
import ResultsEditorSideToolArea from "./ResultsEditorSideToolArea.vue";
import ConstraintOverview from "./ConstraintOverview.vue";

import SpreadsheetTreeView2ColumnsFilter from "./SpreadsheetTreeView2ColumnsFilter.vue";

import ImportFile from "./results-editor-side-panels/ImportFile.vue";
import ExportFile from "./results-editor-side-panels/ExportFile.vue";
import Move from "./results-editor-side-panels/Move.vue";
import Swap from "./results-editor-side-panels/Swap.vue";
// import Print from "./results-editor-side-panels/Print.vue";
// import Help from "./results-editor-side-panels/Help.vue";

const MENU_BAR_ITEMS: ReadonlyArray<MenuItem> = [
    {
        name: "import",
        label: "Import",
        region: "start",
        component: ImportFile,
    },
    {
        name: "export",
        label: "Export",
        region: "start",
        component: ExportFile,
    },
    // {
    //     name: "print",
    //     label: "Print",
    //     region: "start",
    //     component: Print,
    // },
    {
        name: "move",
        label: "Move a person",
        component: Move,
    },
    {
        name: "swap",
        label: "Swap people",
        component: Swap,
    },
    // {
    //     name: "add",
    //     label: "Add a person or group",
    // },
    // {
    //     name: "remove",
    //     label: "Remove a person or group",
    // },
    // {
    //     name: "help",
    //     label: "Help",
    //     region: "end",
    //     component: Help,
    // },
];

@Component({
  components: {
    SpreadsheetTreeView2,
    ResultsEditorSideToolArea,
    ConstraintOverview,
    SpreadsheetTreeView2ColumnsFilter
  }
})
export default class ResultsEditor extends Vue {
  // Private
  /** Stores the indices of the columns to be displayed */
  p_columnsDisplayIndices: ReadonlyArray<number> | undefined = undefined;

  // Private
  /** Stores `node` ids of nodes which were collapsed (hidden).   */
  hiddenNodes: { [key: string]: true } = {};

  /** New reference to module state */
  get state() {
    return S.state;
  }

  // TODO: Remove the need for getting creator state, replace with result editor's own state
  get creatorState() {
    return S_AnnealCreator.state;
  }

  get recordData() {
    return this.state.recordData;
  }

  get columns() {
    return this.recordData.source.columns;
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

  get constraintsArray() {
    return this.state.constraintConfig.constraints;
  }

  get limitConstraints() {
      return this.constraintsArray.filter((constraint) => constraint.type === "limit");
  }

  //TODO: Replace with Result editor's state when ready
  // get annealResults() {
  //   // const responseContent = (this.creatorState.annealRequest as any).response;
  //   // const responseData = responseContent.data as any;

  //   // We're working on the presumption that we definitely have results
  //   // return responseData.results!;
  //   this.state.satisfaction
  //   return [];
  // }

  //TODO: Replace with Result editor's state when ready
  get annealSatisfactionMap() {
    return this.state.satisfaction.satisfactionMap;
    // return this.annealResults.map((res: any) => res.result!.satisfaction).reduce((carry: any, sMap: any) => { 
    //     // const satisfactionMap = sMap;
    //     const satisfactionMap = sMap.satisfactionMap;
    //     return Object.assign(carry, satisfactionMap);
        
    //     }, {});
  }

  get annealStratumStatistics() {
    // const partitionStatsArray = this.annealResults.map((result: any) => result.result!.satisfaction.statistics);
    const partitionStatsArray = this.state.satisfaction.statistics;

    
    const limitConstraintDistributionMap = this.limitConstraints.map((constraint) => {
        
        type KeyNumPair = {[key: string]: number|undefined};
        const distributionMap: {actual: KeyNumPair, expected:KeyNumPair} = {actual: {}, expected: {}};

        partitionStatsArray.forEach((statistics: any) => {
            const stats = statistics[constraint._id];

            for(let numberOfNodes in stats.actualDistribution) {
                if(distributionMap.actual[numberOfNodes] === undefined) distributionMap.actual[numberOfNodes] = stats.actualDistribution[numberOfNodes];
                else {
                    distributionMap.actual[numberOfNodes] += stats.actualDistribution[numberOfNodes];
                }
            }


            for(let numberOfNodes in stats.expectedDistribution) {
                if(distributionMap.expected[numberOfNodes] === undefined) distributionMap.expected[numberOfNodes] = stats.expectedDistribution[numberOfNodes];
                else {
                    distributionMap.expected[numberOfNodes] += stats.expectedDistribution[numberOfNodes];
                }
            }
        });

        return {constraint: constraint, distributionMap: distributionMap};
    })


    return limitConstraintDistributionMap;
    
      
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
    // When we have an active side panel tool open
    const activeSidePanelTool = S.state.sideToolArea.activeItem;

    if (activeSidePanelTool === undefined) {
      return;
    }

    // TODO: Proper UI design for this feature
    const nodeStyles: Map<string | RecordElement, { color?: string; backgroundColor?: string }> = new Map();

    switch (activeSidePanelTool.name) {
      case "move": {
        const moveToolData: MoveSidePanelToolData = activeSidePanelTool.data;

        if (moveToolData.sourcePerson !== undefined) {
          nodeStyles.set(moveToolData.sourcePerson.id, { color: "#fff", backgroundColor: "#49075e" });
        }

        if (moveToolData.targetGroup !== undefined) {
          nodeStyles.set(moveToolData.targetGroup, { color: "#fff", backgroundColor: "#000" });
        }

        return nodeStyles;
      }

      case "swap": {
        const swapToolData: SwapSidePanelToolData = activeSidePanelTool.data;

        if (swapToolData.personA !== undefined) {
          nodeStyles.set(swapToolData.personA.id, { color: "#fff", backgroundColor: "#49075e" });
        }

        if (swapToolData.personB !== undefined) {
          nodeStyles.set(swapToolData.personB.id, { color: "#fff", backgroundColor: "#49075e" });
        }

        return nodeStyles;
      }
    }

    return nodeStyles;
  }

  get columnsDisplayIndices() {
    // Return indices with a default initialised to all columns visible
    return this.p_columnsDisplayIndices || this.columns.map((_, i) => i);
  }

  set columnsDisplayIndices(indices: ReadonlyArray<number>) {
    this.p_columnsDisplayIndices = indices;
  }

  visibleColumnListUpdateHandler(columnList: ReadonlyArray<number>) {
    this.columnsDisplayIndices = columnList;
  }

  /** Checks if `node` id exists as a key in the `hiddenNodes` object. */
  isNodeVisible(node: GroupNode) {
    return this.hiddenNodes[node._id] === undefined;
  }

  /** Hides the selected `node` (Adds it to the `hiddenNodes` object). Passed down as a `prop` to child components. */
  onToggleNodeVisibility(node: GroupNode) {
    if (this.isNodeVisible(node)) {
      Vue.set(this.hiddenNodes, node._id, true);
    } else {
      Vue.delete(this.hiddenNodes, node._id);
    }
  }

  get menuBarItems() {
    return MENU_BAR_ITEMS;
  }

  /** 
   * Determines when to display the main workspace for the results editor,
   * containing the spreadsheet and other parts
   */
  get displayWorkspace() {
      return this.nodeRoots.length > 0;
  }
  
  onItemClickHandler(data: ({ node: GroupNode } | { recordId: RecordElement })[]) {
    // When we have an active side panel tool open
    const activeSidePanelTool = S.state.sideToolArea.activeItem;

    if (activeSidePanelTool === undefined) {
      return;
    }

    switch (activeSidePanelTool.name) {
      case "move": {
        const moveToolData: MoveSidePanelToolData = activeSidePanelTool.data;
        const cursor = moveToolData.cursor;

        switch (cursor) {
          case "sourcePerson": {
            // TODO: Fix type narrowing
            const targetItemParent: any = data[data.length - 2];
            const targetItem: any = data[data.length - 1];

            // Can only move records with valid parent
            if (targetItem.recordId === undefined || targetItemParent.node === undefined || targetItemParent.node.type !== "leaf-stratum") {
              return;
            }

            // TODO: Encode richer information about the record, and
            // not just the ID?
            S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, {
              sourcePerson: { node: targetItemParent.node._id, id: targetItem.recordId }
            });

            return;
          }

          case "targetGroup": {
            // Get the lowest stratum selected
            const targetNodeReversedIndex = [...data].reverse().findIndex((item: any) => item.node !== undefined);
            const arrayCopyLength = targetNodeReversedIndex === -1 ? data.length : data.length - targetNodeReversedIndex;
            // TODO: Fix type narrowing
            const targetPath = (data.slice(0, arrayCopyLength) as { node: GroupNode }[]).map(item => item.node);
            const targetNode = targetPath[targetPath.length - 1];

            // Can only move records to other leaf stratum nodes
            if (targetNode.type !== "leaf-stratum") {
              return;
            }

            // TODO: Encode richer information about the node like
            // the path?
            S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { targetGroup: targetNode._id });

            return;
          }
        }

        return;
      }

      case "swap": {
        const swapToolData: SwapSidePanelToolData = activeSidePanelTool.data;
        const cursor = swapToolData.cursor;

        switch (cursor) {
          case "personA": {
            // TODO: Fix type narrowing
            const targetItemParent: any = data[data.length - 2];
            const targetItem: any = data[data.length - 1];

            // Can only move records with valid parent
            if (targetItem.recordId === undefined || targetItemParent.node === undefined || targetItemParent.node.type !== "leaf-stratum") {
              return;
            }

            // If person B defined, do not set person A equal to B
            if (swapToolData.personB !== undefined && targetItem.recordId === swapToolData.personB.id) {
              // TODO: Proper error handling
              throw new Error("Person selected must be different from that already selected as the other target for a swap operation");
            }

            // TODO: Encode richer information about the record, and
            // not just the ID?
            S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { personA: { node: targetItemParent.node._id, id: targetItem.recordId } });

            return;
          }

          case "personB": {
            // TODO: Fix type narrowing
            const targetItemParent: any = data[data.length - 2];
            const targetItem: any = data[data.length - 1];

            // Can only move records with valid parent
            if (targetItem.recordId === undefined || targetItemParent.node === undefined || targetItemParent.node.type !== "leaf-stratum") {
              return;
            }

            // If person A defined, do not set person B equal to A
            if (swapToolData.personA !== undefined && targetItem.recordId === swapToolData.personA.id) {
              // TODO: Proper error handling
              throw new Error("Person selected must be different from that already selected as the other target for a swap operation");
            }

            // TODO: Encode richer information about the record, and
            // not just the ID?
            S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { personB: { node: targetItemParent.node._id, id: targetItem.recordId } });

            return;
          }
        }

        return;
      }
    }
  }

  get recordLookupMap() {
    const idColumnIndex = this.idColumnIndex;

    return this.recordRows.reduce((map, record) => {
      const id = record[idColumnIndex];
      const filteredRecord = record.filter((_r, i) => this.columnsDisplayIndices.indexOf(i) !== -1);
      map.set(id, filteredRecord);
      return map;
    }, new Map<RecordElement, Record>());
  }

//   get numberOfPassingGroupsPerConstraintMap() {
//     const partitionNodeArrayMap = S.get(S.getter.GET_PARTITION_NODE_MAP);
//     const nodeRecordsArrayMap = S.get(S.getter.GET_ALL_GROUP_NODES_RECORDS_ARRAY_MAP);
//     return LimitConstraintSatisfaction.getNumberOfPassingGroupsPerConstraint(
//       this.constraintsArray,
//       nodeRecordsArrayMap,
//       partitionNodeArrayMap,
//       this.generateNodeStratumMap,
//       this.recordLookupMap,
//       this.columns
//     );
//   }

  // TODO: Remove this and implement properly in its own ticket.
  get generateNodeStratumMap() {
    const map: { [nodeId: string]: string } = {};

    const strataArray = [...this.strata].reverse();

    function mapGenerationIterator(node: GroupNode, depth: number) {
      switch (node.type) {
        case "root": {
          // Don't define the root node into the node-stratum map
          // because it doesn't actually exist on a "stratum"
          node.children.forEach(child => mapGenerationIterator(child, depth));
          break;
        }

        case "intermediate-stratum": {
          map[node._id] = strataArray[strataArray.length - 1 - depth]._id;
          node.children.forEach(child => mapGenerationIterator(child, depth + 1));
          break;
        }

        case "leaf-stratum": {
          map[node._id] = strataArray[strataArray.length - 1 - depth]._id;
          break;
        }
      }
    }

    this.state.groupNode.structure.roots.forEach(rootNode => {
      mapGenerationIterator(rootNode, 0);
    });

    return map;
  }
    openImportSidePanel() {
        S.dispatch(S.action.SET_SIDE_PANEL_ACTIVE_TOOL_BY_NAME, "import");
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
    display: flex;
    flex-direction: column;
    background: #fff;
    position: relative;
    overflow: none;

    /** This sets the workspace to take the minimal amount of room required */
    width: 0;
}

.side-tool-area {
  flex-grow: 0;
  flex-shrink: 0;
}

.spreadsheet {
    flex-grow: 1;
}

.get-started {
    width: 100%;
    padding: 3em;
    background: #f2f2f2;
    background: linear-gradient(to bottom right, transparent, transparent 70%, rgba(73, 7, 94, 0.5)), #f2f2f2;
}

.get-started h1 {
    color: #49075E;
    font-weight: 400;
    font-size: 3em;
    margin-top: 0;
}

.get-started a,
.get-started a:visited {
    color: #00d;
}

.constraint-overview {
  max-width: 25%;
}
</style>
