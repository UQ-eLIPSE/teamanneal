import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";

import { Stratum } from "./Stratum";
import { Data as IColumnData } from "./ColumnData";

import * as ListCounter from "./ListCounter";

export type NodeNameMap = WeakMap<AnnealNode.Node, NodeNameDescription>;
export type NodeNameMapNameGenerated = WeakMap<AnnealNode.Node, NodeNameDescriptionNameGenerated>;
export type NodeNameMapNameNotGenerated = WeakMap<AnnealNode.Node, NodeNameDescriptionNameNotGenerated>;

export type RecordNodeNameAccumulatedArray = ReadonlyArray<NodeNameDescriptionBase>;
export type RecordNodeNameMap = Map<Record.RecordElement, RecordNodeNameAccumulatedArray>;

type GlobalShimNode = { _id: "_GLOBAL" };

export type NodeNameContextMap = WeakMap<AnnealNode.Node | GlobalShimNode, NodeNameContextMapStratumCountTrack>;

interface NodeNameContextMapStratumCountTrack {
    /** 
     * The value (number) is a monotonically increasing count that indicates 
     * how many times that particular stratum's context has been used for
     * node name generation
     */
    [stratumId: string]: number,
}

type NodeNameDescription = NodeNameDescriptionNameNotGenerated | NodeNameDescriptionNameGenerated;

interface NodeNameDescriptionBase {
    /** Stratum object ID */
    stratumId: string,

    /** Label of the stratum associated to this node */
    // Label not necessarily generated at this point
    stratumLabel: string | undefined,

    /** Generated name for this node is not yet generated */
    nodeGeneratedName: string | undefined,
}

interface NodeNameDescriptionNameNotGenerated extends NodeNameDescriptionBase {
    /** 
     * The index of this node in the naming context; used to indicate what 
     * position the node is in the context
     */
    nodeNameContextIndex: number,
}

interface NodeNameDescriptionNameGenerated extends NodeNameDescriptionBase {
    // Label generated, definitely string
    stratumLabel: string,

    /** 
     * The index of this node in the naming context; used to indicate what 
     * position the node is in the context
     */
    nodeNameContextIndex: number,
}

export namespace ResultTree {

    // Global shim node object
    const _GLOBAL_NODE: GlobalShimNode = { _id: "_GLOBAL" };

    export function GenerateNodeNameMap(strata: ReadonlyArray<Stratum>, partitionColumn: IColumnData | undefined, nodes: ReadonlyArray<AnnealNode.NodeRoot>) {
        const nameMap: NodeNameMapNameNotGenerated = new WeakMap();
        const contextMap: NodeNameContextMap = new WeakMap();

        // For each node, recursively walk down and generate the 
        // unapplied description objects for them
        SetNodeNameDescObjectsRecursive(nameMap, contextMap, strata, partitionColumn, [], nodes);

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
        UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap, contextMap, strata, [], nodes);

        // At this point the names should have been successfully attached to
        // the description objects
        return nameMap as NodeNameMap as NodeNameMapNameGenerated;  // Type assertion up then down
    }

    /**
     * Recursive function that sets `NodeNameDescriptionNameNotGenerated` name
     * description objects on nodes 
     * 
     * @param nameMap 
     * @param contextMap 
     * @param strata 
     * @param partitionColumn 
     * @param nodePath Array of nodes that represents the path from the root node to the current parent node of the supplied child nodes
     * @param childNodes Child nodes which are children of the last node in the node path
     */
    function SetNodeNameDescObjectsRecursive(nameMap: NodeNameMapNameNotGenerated, contextMap: NodeNameContextMap, strata: ReadonlyArray<Stratum>, partitionColumn: IColumnData | undefined, nodePath: ReadonlyArray<AnnealNode.Node>, childNodes: ReadonlyArray<AnnealNode.Node>) {
        childNodes.forEach((node) => {
            // Go down into each child node and set name description objects
            const deeperNodePath = [...nodePath, node];
            SetNodeNameDescObject(nameMap, contextMap, strata, partitionColumn, deeperNodePath);

            // Can't continue further for record-only leaf nodes
            if (node.type === "stratum-records") {
                return;
            }

            SetNodeNameDescObjectsRecursive(nameMap, contextMap, strata, partitionColumn, deeperNodePath, node.children);
        });

        // Do not return a value - this indicates it operates in place
        return;
    }

    /**
     * Function that sets `NodeNameDescriptionNameNotGenerated` name
     * description object for one node
     */
    function SetNodeNameDescObject(nameMap: NodeNameMapNameNotGenerated, contextMap: NodeNameContextMap, strata: ReadonlyArray<Stratum>, partitionColumn: IColumnData | undefined, nodePath: ReadonlyArray<AnnealNode.Node>) {
        let stratumNamingContext: string;
        let nodeStratumId: string;
        let nodeStratumLabel: string;
        let nodeGeneratedName: string | undefined;

        const node = nodePath[nodePath.length - 1];

        if (node.type === "root") {
            // Partitions (which only exist on "root") are handled as higher
            // level strata, unique globally
            stratumNamingContext = "_GLOBAL";
            nodeStratumId = "_PARTITION";
            nodeGeneratedName = node.partitionValue;

            if (partitionColumn === undefined) {
                nodeStratumLabel = "";
            } else {
                nodeStratumLabel = partitionColumn.label;
            }

        } else {
            // Get back the original stratum object
            const nodeStratum = strata.find(s => s._id === node.stratum);

            if (nodeStratum === undefined) {
                throw new Error(`Stratum "${node.stratum}" not found`);
            }

            stratumNamingContext = nodeStratum.namingConfig.context;
            nodeStratumId = nodeStratum._id;
            nodeStratumLabel = nodeStratum.label;
            nodeGeneratedName = undefined;  // Remember we haven't generated a name yet!
        }

        // Find the node that is responsible for that context
        const namingContextNode = FindTargetContextNode(stratumNamingContext, nodePath);

        if (namingContextNode === undefined) {
            throw new Error(`Context "${stratumNamingContext}" not found`);
        }

        // Create a new tracking object if it does not exist for that context
        // and set it into the contextMap
        const contextNameCountTrackingObject =
            contextMap.get(namingContextNode) || contextMap.set(namingContextNode, {}).get(namingContextNode)!;

        // Get the name generation index count for that particular stratum under 
        // this context
        const nameGenerationIndex = contextNameCountTrackingObject[nodeStratumId] || 0;

        // Wrap up info
        const nodeNameDesc: NodeNameDescriptionNameNotGenerated = {
            stratumId: nodeStratumId,
            stratumLabel: nodeStratumLabel,
            nodeGeneratedName,
            nodeNameContextIndex: nameGenerationIndex,
        };

        // Increment name generation count
        contextNameCountTrackingObject[nodeStratumId] = nameGenerationIndex + 1;

        // Add name desc to name map
        nameMap.set(node, nodeNameDesc);

        // Do not return a value - this indicates it operates in place
        return;
    }

    /**
     * Finds the node which is responsible for target naming context.
     * 
     * @param targetContext Context or stratum ID
     * @param nodePath Array of nodes that represents the path from the root node to the current node being searched
     */
    function FindTargetContextNode(targetContext: string | "_PARTITION" | "_GLOBAL", nodePath: ReadonlyArray<AnnealNode.Node>): AnnealNode.Node | GlobalShimNode | undefined {
        if (targetContext === "_GLOBAL") {
            return _GLOBAL_NODE;
        }

        // We drop the last node in the `nodes` array because the current node
        // (last one in the array) is not used for context searches
        // This applies when we recursively go back up through the path
        const upperNodes = nodePath.slice(0, -1);
        const parent = upperNodes[upperNodes.length - 1];

        if (parent === undefined) {
            return undefined;
        }

        if (parent.type === "root") {
            if (targetContext === "_PARTITION") {
                // If we're looking for a partition - "root" nodes are partitions
                return parent;
            } else {
                // We can't go further up the tree - we've hit a root node!
                return undefined;
            }
        }

        // If the parent is the context we want
        if (parent.stratum === targetContext) {
            return parent;
        }

        return FindTargetContextNode(targetContext, upperNodes);
    }

    /**
     * Updates node name description objects by writing in the generated names
     * into the objects.
     * 
     * @param nameMap 
     * @param contextMap 
     * @param strata 
     * @param nodePath Array of nodes that represents the path from the root node to the current node being searched
     * @param childNodes Child nodes which are children of the last node in the node path
     */
    function UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap: NodeNameMap, contextMap: NodeNameContextMap, strata: ReadonlyArray<Stratum>, nodePath: ReadonlyArray<AnnealNode.Node>, childNodes: ReadonlyArray<AnnealNode.Node>) {
        childNodes.forEach((node) => {
            // Go down into each child node and set name description objects
            const deeperNodePath = [...nodePath, node];
            UpdateNodeNameDescObjectWithGeneratedName(nameMap, contextMap, strata, deeperNodePath);

            // Can't continue further for record-only leaf nodes
            if (node.type === "stratum-records") {
                return;
            }

            UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap, contextMap, strata, deeperNodePath, node.children);
        });

        // Do not return a value - this indicates it operates in place
        return;
    }

    /**
     * Updates node name description object by writing in the generated name
     * for the given node at the node path.
     *
     * @param nameMap 
     * @param contextMap 
     * @param strata 
     * @param nodePath Array of nodes that represents the path from the root node to the current node having its name description object updated
     */
    function UpdateNodeNameDescObjectWithGeneratedName(nameMap: NodeNameMap, contextMap: NodeNameContextMap, strata: ReadonlyArray<Stratum>, nodePath: ReadonlyArray<AnnealNode.Node>) {
        // Get the name description object for this node
        const node = nodePath[nodePath.length - 1];
        const nodeNameDescObj = nameMap.get(node);

        if (nodeNameDescObj === undefined) {
            throw new Error("Node does not have associated name description object in provided name map");
        }

        // Partitions (only available on root nodes) should already have names 
        // attached
        if (node.type === "root") {
            return;
        }

        // Get back the original stratum object
        const nodeStratum = strata.find(s => s._id === node.stratum);

        if (nodeStratum === undefined) {
            throw new Error(`Stratum "${node.stratum}" not found`);
        }

        // Get the context tracking object
        const stratumNamingConfig = nodeStratum.namingConfig;
        const stratumNamingContext = stratumNamingConfig.context;

        // Get context name generation count
        const namingContextNode = FindTargetContextNode(stratumNamingContext, nodePath);

        if (namingContextNode === undefined) {
            throw new Error(`Context "${stratumNamingContext}" not found`);
        }

        const contextNameCountTrackingObject = contextMap.get(namingContextNode);

        if (contextNameCountTrackingObject === undefined) {
            throw new Error(`Missing stratum naming context "${stratumNamingContext}" in provided context map`);
        }

        const nodeStratumId = nodeStratum._id;
        const contextNameGenerationCount = contextNameCountTrackingObject[nodeStratumId];

        if (contextNameGenerationCount === undefined) {
            throw new Error(`Missing count tracking object for stratum ID "${nodeStratumId}" in context "${stratumNamingContext}" in provided context map`);
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
            // Counter is of an auto-generated type
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

    export function GenerateRecordNodeNameMap(stratumNodeNameMap: NodeNameMap, nodes: ReadonlyArray<AnnealNode.Node>) {
        const recordNodeNameMap: RecordNodeNameMap = new Map();

        // Walk nodes to build up names for records
        SetRecordNodeNamesRecursive(stratumNodeNameMap, recordNodeNameMap, [], nodes);

        return recordNodeNameMap;
    }

    function SetRecordNodeNamesRecursive(stratumNodeNameMap: NodeNameMap, recordNodeNameMap: RecordNodeNameMap, accumulatedName: RecordNodeNameAccumulatedArray, nodes: ReadonlyArray<AnnealNode.Node>) {
        nodes.forEach((node) => {
            // Fetch node name
            const nameDesc = stratumNodeNameMap.get(node);
            if (nameDesc === undefined) {
                throw new Error("Could not find name description object for node");
            }
            const { stratumId, stratumLabel, nodeGeneratedName } = nameDesc;

            if (nodeGeneratedName === undefined) {
                throw new Error("No generated name found for record node");
            }

            // Accumulate name
            const name = [...accumulatedName, { stratumId, stratumLabel, nodeGeneratedName }];

            if (node.type === "stratum-records") {
                // For each child (record) we map the record to the accumulated 
                // array (name)
                node.recordIds.forEach((recordId) => {
                    recordNodeNameMap.set(recordId, name);
                });

            } else {
                // Recurse down
                SetRecordNodeNamesRecursive(stratumNodeNameMap, recordNodeNameMap, name, node.children);
            }
        });

        // Do not return a value - this indicates it operates in place
        return;
    }
}
