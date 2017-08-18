import * as Record from "../../../common/Record";

import { Data as IState } from "./State";
import { Data as IStratum } from "./Stratum";
import { ColumnData, Data as IColumnData } from "./ColumnData";

import * as ListCounter from "./ListCounter";

/**
 * Either:
 * - an array of children in one stratum, or
 * - a set of records
 */
type ResultArrayContent = ResultArray | Record.RecordSet;

/**
 * Either:
 * - a partition, or
 * - an array of children in one stratum
 */
export interface ResultArray extends ReadonlyArray<ResultArrayContent> { }

/** The full array that the anneal response comes back with */
// export type AnnealOutput = ReadonlyArray<ResultArray>;

export type Node = StratumNode | RecordNode;

interface NodeBase {
    // _id: string,
}

export type StratumNode = StratumNodeWithRecordChildren | StratumNodeWithStrataChildren;

export interface StratumNodeWithRecordChildren extends NodeBase {
    type: "stratum",

    stratum: IStratum,

    children: RecordNode[],
    childrenAreRecords: true,
}

export interface StratumNodeWithStrataChildren extends NodeBase {
    type: "stratum",

    stratum: IStratum,

    children: StratumNode[],
    childrenAreRecords: false,
}

export interface RecordNode extends NodeBase {
    type: "record",

    /** Index of this record in original record data set */
    index: number,
}

export type NodeNameMap = WeakMap<StratumNode, NodeNameDescription>;
export type NodeNameMapNameGenerated = WeakMap<StratumNode, NodeNameDescriptionNameGenerated>;
export type NodeNameMapNameNotGenerated = WeakMap<StratumNode, NodeNameDescriptionNameNotGenerated>;

export type RecordNodeNameAccumulatedArray = ReadonlyArray<{ stratumLabel: string, nodeGeneratedName: string, }>;
export type RecordNodeNameMap = WeakMap<RecordNode, RecordNodeNameAccumulatedArray>;

export interface NodeNameContextMap {
    [context: string]: NodeNameContextMapStratumCountTrack,
}

interface NodeNameContextMapStratumCountTrack {
    /** 
     * The value (number) is a monotonically increasing count that indicates 
     * how many times that particular stratum's context has been used for
     * node name generation
     */
    [stratumId: string]: number,
}

type NodeNameDescription = NodeNameDescriptionNameNotGenerated | NodeNameDescriptionNameGenerated;

interface NodeNameDescriptionNameNotGenerated {
    /** Label of the stratum associated to this node */
    stratumLabel: string,

    /** Generated name for this node is not yet generated */
    nodeGeneratedName: undefined,

    /** 
     * The index of this node in the naming context; used to indicate what 
     * position the node is in the context
     */
    nodeNameContextIndex: number,
}

interface NodeNameDescriptionNameGenerated {
    /** Label of the stratum associated to this node */
    stratumLabel: string,

    /** Generated name for this node */
    nodeGeneratedName: string,

    /** 
     * The index of this node in the naming context; used to indicate what 
     * position the node is in the context
     */
    nodeNameContextIndex: number,
}

export namespace ResultTree {
    export function InitNodesFromResultArray(state: IState, resultArray: ResultArray) {
        // TODO: Move away from reading the state object because the state may
        // be subject to change between the time the anneal request was made and
        // when the result array is available

        const { columns, idColumn } = state.recordData;
        const { strata } = state.annealConfig;

        if (idColumn === undefined) {
            throw new Error("No ID column minimal descriptor object found");
        }

        const idColumnIndex = columns.findIndex(c => ColumnData.Equals(idColumn, c));

        if (idColumnIndex < 0) {
            throw new Error("ID column not found");
        }

        return resultArray.map((resultArrayContent) =>
            InitNodeRecursive(columns[idColumnIndex], idColumnIndex, strata, resultArrayContent)
        );
    }

    function InitNodeRecursive(idColumnData: IColumnData, idColumnIndex: number, [currentStratum, ...remainingStrata]: ReadonlyArray<IStratum>, resultArrayContent: ResultArrayContent): StratumNode {
        if (currentStratum === undefined) {
            throw new Error("No stratum information provided");
        }

        if (remainingStrata.length === 0) {
            // We have no additional strata left, so we're at the stage where we 
            // generate NodeRecord objects for children
            const records = resultArrayContent as Record.RecordSet;
            const idColumnCookedValues: ReadonlyArray<number | string | null> = ColumnData.GetCookedColumnValues(idColumnData);

            // Map out record nodes for children
            const children =
                records.map((record) => {
                    // Get the cooked ID column value from the returned records
                    // and find their indices in the original record data set
                    const recordIndex = idColumnCookedValues.indexOf(record[idColumnIndex]);

                    if (recordIndex < 0) {
                        throw new Error("Record not found");
                    }

                    const node: RecordNode = {
                        type: "record",
                        index: recordIndex,
                    };

                    return node;
                });

            // Create stratum node
            const stratumNode: StratumNode = {
                type: "stratum",
                stratum: currentStratum,
                children,
                childrenAreRecords: true,
            };

            return stratumNode;

        } else {
            // If we still have more than one stratum, then we create stratum
            // nodes that nest other nodes
            const nestedResultArray = resultArrayContent as ResultArray;

            const children = nestedResultArray.map(content => InitNodeRecursive(idColumnData, idColumnIndex, remainingStrata, content));

            // Create stratum node
            const stratumNode: StratumNode = {
                type: "stratum",
                stratum: currentStratum,
                children,
                childrenAreRecords: false,
            };

            return stratumNode;
        }
    }

    export function GenerateNodeNameMap(nodes: ReadonlyArray<StratumNode>) {
        const nameMap: NodeNameMapNameNotGenerated = new WeakMap();
        const contextMap: NodeNameContextMap = {};

        // For each stratum node, recursively walk down and generate the 
        // unapplied description objects for them
        SetNodeNameDescObjectsRecursive(nameMap, contextMap, nodes);

        // =====================================================================
        // At this point the name description objects exist in the name map, but
        // the names themselves have not been generated and attached to them
        //
        // This is because some names require knowledge of the entire context's
        // set of names first; this requires a second pass where we then read in 
        // the context map and use that in generating names
        //
        // e.g. "leading zero" names need to know how many nodes were named in
        //      some context to be able to appropriately pad out "0" characters
        //      to the left
        // =====================================================================

        // Apply second pass where names are actually generated and applied
        UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap, contextMap, nodes);

        return {
            // At this point the names should have been successfully attached to
            // the description objects
            nameMap: nameMap as NodeNameMap as NodeNameMapNameGenerated,    // Type assertion up then down
            contextMap,
        };
    }

    /**
     * Recursive function that sets `NodeNameDescriptionNameNotGenerated` name
     * description objects on stratum nodes 
     */
    function SetNodeNameDescObjectsRecursive(nameMap: NodeNameMapNameNotGenerated, contextMap: NodeNameContextMap, nodes: ReadonlyArray<StratumNode>) {
        nodes.forEach((node) => {
            SetNodeNameDescObject(nameMap, contextMap, node);

            // We will only recurse if there are more strata underneath
            //
            // This check is done by inspecting the first child's type:
            // if this is yet another stratum, then we can go deeper
            if (node.children.length === 0) {
                // Can't continue further if stratum has no children
                return;
            }

            if (!node.childrenAreRecords) {
                // Recurse into child strata
                SetNodeNameDescObjectsRecursive(nameMap, contextMap, node.children as StratumNode[]);
            }
        });

        // Do not return a value - this indicates it operates in place
        return;
    }

    /**
     * Function that sets `NodeNameDescriptionNameNotGenerated` name
     * description object for one stratum node
     */
    function SetNodeNameDescObject(nameMap: NodeNameMapNameNotGenerated, contextMap: NodeNameContextMap, node: StratumNode) {
        // Get the context tracking object
        const stratumNamingContext = node.stratum.namingConfig.context;

        // Create a new tracking object if it does not exist for that context
        // and set it into the contextMap
        const contextNameCountTrackingObject =
            contextMap[stratumNamingContext] || (contextMap[stratumNamingContext] = {});

        // Get the name generation index count for that particular stratum under 
        // this context
        const nodeStratumId = node.stratum._id;
        const nameGenerationIndex = contextNameCountTrackingObject[nodeStratumId] || 0;

        // Wrap up info
        const nodeNameDesc: NodeNameDescriptionNameNotGenerated = {
            stratumLabel: node.stratum.label,
            nodeGeneratedName: undefined,
            nodeNameContextIndex: nameGenerationIndex,
        };

        // Increment name generation count
        contextNameCountTrackingObject[nodeStratumId] = nameGenerationIndex + 1;

        // Add name desc to name map
        nameMap.set(node, nodeNameDesc);

        // Do not return a value - this indicates it operates in place
        return;
    }

    function UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap: NodeNameMap, contextMap: NodeNameContextMap, nodes: ReadonlyArray<StratumNode>) {
        nodes.forEach((node) => {
            UpdateNodeNameDescObjectWithGeneratedName(nameMap, contextMap, node);

            // We will only recurse if there are more strata underneath
            //
            // This check is done by inspecting the first child's type:
            // if this is yet another stratum, then we can go deeper
            if (node.children.length === 0) {
                // Can't continue further if stratum has no children
                return;
            }

            if (!node.childrenAreRecords) {
                // Recurse into child strata
                UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap, contextMap, node.children as ReadonlyArray<StratumNode>);
            }
        });

        // Do not return a value - this indicates it operates in place
        return;
    }

    function UpdateNodeNameDescObjectWithGeneratedName(nameMap: NodeNameMap, contextMap: NodeNameContextMap, node: StratumNode) {
        // Get the context tracking object
        const stratumNamingConfig = node.stratum.namingConfig;
        const stratumNamingContext = stratumNamingConfig.context;

        // Get context name generation count
        const contextNameCountTrackingObject = contextMap[stratumNamingContext];

        if (contextNameCountTrackingObject === undefined) {
            throw new Error(`Missing stratum naming context "${stratumNamingContext}" in provided context map`);
        }

        const nodeStratumId = node.stratum._id;
        const contextNameGenerationCount = contextNameCountTrackingObject[nodeStratumId];

        if (contextNameGenerationCount === undefined) {
            throw new Error(`Missing count tracking object for stratum ID "${nodeStratumId}" in context "${stratumNamingContext}" in provided context map`);
        }

        // Get the name description object for this node
        const nodeNameDescObj = nameMap.get(node);

        if (nodeNameDescObj === undefined) {
            throw new Error("Node does not have associated name description object in provided name map");
        }

        // Generate and apply the name
        const stratumNamingCounter = stratumNamingConfig.counter;
        const nameContextNodeIndex = nodeNameDescObj.nodeNameContextIndex;

        if (Array.isArray(stratumNamingCounter)) {
            // Counter is an arbitrary string array that the user provided

            // Trim all values and filter out blanks
            // 
            // We can't block people from at least providing blanks for the
            // final counter value in the input array because stripping it out
            // will cause Vue to feed back values without the final line to the
            // input <textarea /> when a user hits the ENTER key, and thus
            // preventing them from ever creating a new line.
            //
            // This is also the same case for stripping out spaces in each line:
            // that would prevent people from putting spaces into names as each
            // press of the SPACEBAR key would still end up with a line without
            // spaces.
            const counterArray =
                stratumNamingCounter
                    .map(counterString => counterString.trim())
                    .filter(counterString => counterString.length !== 0);

            const counterArrayLength = counterArray.length;

            let counterValue = counterArray[nameContextNodeIndex % counterArrayLength];

            // Not enough counter strings, so adding an extra number at the end
            // in an attempt to make the team names distinct
            //
            // For example:
            // * Team Red           ┐
            // * Team Green         ├ The actual counter array is of length 3
            // * Team Blue          ┘
            // * Team Red 2         ┐
            // * Team Green 2       ├ "2" is appended at the end
            // * Team Blue 2        ┘
            // ...

            if (nameContextNodeIndex >= counterArrayLength) {
                const suffix = ((nameContextNodeIndex / counterArrayLength) >>> 0) + 1;
                counterValue += ` ${suffix}`;
            }

            nodeNameDescObj.nodeGeneratedName = counterValue;

        } else {
            // Counter is a of an auto-generated type
            const listCounters = ListCounter.SupportedListCounters;
            const counterDesc = listCounters.find(x => x.type === stratumNamingCounter);

            if (counterDesc === undefined) {
                throw new Error(`Counter "${stratumNamingCounter}" not supported`);
            }

            nodeNameDescObj.nodeGeneratedName = counterDesc.generator(nameContextNodeIndex, contextNameGenerationCount);
        }

        // Do not return a value - this indicates it operates in place
        return;
    }

    export function GenerateRecordNodeNameMap(stratumNodeNameMap: NodeNameMap, nodes: StratumNode[]) {
        const recordNodeNameMap: RecordNodeNameMap = new WeakMap();

        // Walk nodes to build up names for records
        SetRecordNodeNamesRecursive(stratumNodeNameMap, recordNodeNameMap, [], nodes);

        return recordNodeNameMap;
    }

    function SetRecordNodeNamesRecursive(stratumNodeNameMap: NodeNameMap, recordNodeNameMap: RecordNodeNameMap, accumulatedName: RecordNodeNameAccumulatedArray, nodes: StratumNode[]) {
        nodes.forEach((node) => {
            // Fetch stratum node name
            const nameDesc = stratumNodeNameMap.get(node);
            if (nameDesc === undefined) {
                throw new Error("Could not find name description object for node");
            }
            const { stratumLabel, nodeGeneratedName } = nameDesc;

            if (nodeGeneratedName === undefined) {
                throw new Error("No generated name found for record node");
            }

            // Accumulate name
            const name = [...accumulatedName, { stratumLabel, nodeGeneratedName }];

            if (node.childrenAreRecords) {
                // For each child (record) we map the record to the accumulated 
                // array (name)
                node.children.forEach((recordNode) => {
                    recordNodeNameMap.set(recordNode, name);
                });

            } else if (node.childrenAreRecords === false) {
                // Recurse down
                SetRecordNodeNamesRecursive(stratumNodeNameMap, recordNodeNameMap, name, node.children);
            }
        });

        // Do not return a value - this indicates it operates in place
        return;
    }

    export function ExtractRecordNodes(nodes: StratumNode[]) {
        const records: RecordNode[] = [];
        ExtractRecordNodesRecursive(records, nodes);
        return records;
    }

    function ExtractRecordNodesRecursive(accumulatedRecords: RecordNode[], nodes: StratumNode[]) {
        nodes.forEach((node) => {
            if (node.childrenAreRecords) {
                node.children.forEach((recordNode) => {
                    accumulatedRecords.push(recordNode);
                });
            } else if (node.childrenAreRecords === false) {
                ExtractRecordNodesRecursive(accumulatedRecords, node.children);
            }
        });

        // Do not return a value - this indicates it operates in place
        return;
    }
}
