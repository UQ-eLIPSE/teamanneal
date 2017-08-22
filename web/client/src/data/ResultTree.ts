import * as Record from "../../../common/Record";
import * as AnnealNode from "../../../common/AnnealNode";

import { Data as IStratum } from "./Stratum";
import { Data as IColumnData } from "./ColumnData";

import * as ListCounter from "./ListCounter";

export type NodeNameMap = WeakMap<AnnealNode.Node, NodeNameDescription>;
export type NodeNameMapNameGenerated = WeakMap<AnnealNode.Node, NodeNameDescriptionNameGenerated>;
export type NodeNameMapNameNotGenerated = WeakMap<AnnealNode.Node, NodeNameDescriptionNameNotGenerated>;

export type RecordNodeNameAccumulatedArray = ReadonlyArray<{ type: "partition" | "ordinary", stratumLabel: string, nodeGeneratedName: string, }>;
export type RecordNodeNameMap = Map<Record.RecordElement, RecordNodeNameAccumulatedArray>;

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
    type: "partition" | "ordinary",

    /** Label of the stratum associated to this node */
    stratumLabel: string,

    /** Generated name for this node is not yet generated */
    nodeGeneratedName: string | undefined,

    /** 
     * The index of this node in the naming context; used to indicate what 
     * position the node is in the context
     */
    nodeNameContextIndex: number,
}

interface NodeNameDescriptionNameGenerated {
    type: "partition" | "ordinary",

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
    export function GenerateNodeNameMap(strata: ReadonlyArray<IStratum>, partitionColumn: IColumnData | undefined, nodes: ReadonlyArray<AnnealNode.NodeRoot>) {
        const nameMap: NodeNameMapNameNotGenerated = new WeakMap();
        const contextMap: NodeNameContextMap = {};

        // For each node, recursively walk down and generate the 
        // unapplied description objects for them
        SetNodeNameDescObjectsRecursive(nameMap, contextMap, strata, partitionColumn, nodes);

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
        UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap, contextMap, strata, nodes);

        return {
            // At this point the names should have been successfully attached to
            // the description objects
            nameMap: nameMap as NodeNameMap as NodeNameMapNameGenerated,    // Type assertion up then down
            contextMap,
        };
    }

    /**
     * Recursive function that sets `NodeNameDescriptionNameNotGenerated` name
     * description objects on nodes 
     */
    function SetNodeNameDescObjectsRecursive(nameMap: NodeNameMapNameNotGenerated, contextMap: NodeNameContextMap, strata: ReadonlyArray<IStratum>, partitionColumn: IColumnData | undefined, nodes: ReadonlyArray<AnnealNode.Node>) {
        nodes.forEach((node) => {
            SetNodeNameDescObject(nameMap, contextMap, strata, node);

            // Can't continue further for record-only leaf nodes
            if (node.type === "stratum-records") {
                return;
            }

            SetNodeNameDescObjectsRecursive(nameMap, contextMap, strata, partitionColumn, node.children);
        });

        // Do not return a value - this indicates it operates in place
        return;
    }

    /**
     * Function that sets `NodeNameDescriptionNameNotGenerated` name
     * description object for one node
     */
    function SetNodeNameDescObject(nameMap: NodeNameMapNameNotGenerated, contextMap: NodeNameContextMap, strata: ReadonlyArray<IStratum>, node: AnnealNode.Node) {
        let nodeNameType: "partition" | "ordinary";
        let stratumNamingContext: string;
        let nodeStratumId: string;
        let nodeStratumLabel: string;
        let nodeGeneratedName: string | undefined;

        if (node.type === "root") {
            // Partitions (which only exist on "root") are handled as higher
            // level strata, unique globally
            nodeNameType = "partition";
            stratumNamingContext = "_GLOBAL";
            nodeStratumId = "_PARTITION";
            nodeStratumLabel = "";
            nodeGeneratedName = node.partitionValue;

        } else {
            // Get back the original stratum object
            const nodeStratum = strata.find(s => s._id === node.stratum);

            if (nodeStratum === undefined) {
                throw new Error(`Stratum "${node.stratum}" not found`);
            }

            nodeNameType = "ordinary";
            stratumNamingContext = nodeStratum.namingConfig.context;
            nodeStratumId = nodeStratum._id;
            nodeStratumLabel = nodeStratum.label;
            nodeGeneratedName = undefined;  // Remember we haven't generated a name yet!
        }

        // Create a new tracking object if it does not exist for that context
        // and set it into the contextMap
        const contextNameCountTrackingObject =
            contextMap[stratumNamingContext] || (contextMap[stratumNamingContext] = {});

        // Get the name generation index count for that particular stratum under 
        // this context
        const nameGenerationIndex = contextNameCountTrackingObject[nodeStratumId] || 0;

        // Wrap up info
        const nodeNameDesc: NodeNameDescriptionNameNotGenerated = {
            type: nodeNameType,
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

    function UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap: NodeNameMap, contextMap: NodeNameContextMap, strata: ReadonlyArray<IStratum>, nodes: ReadonlyArray<AnnealNode.Node>) {
        nodes.forEach((node) => {
            UpdateNodeNameDescObjectWithGeneratedName(nameMap, contextMap, strata, node);

            // Can't continue further for record-only leaf nodes
            if (node.type === "stratum-records") {
                return;
            }

            UpdateNodeNameDescObjectsWithGeneratedNamesRecursive(nameMap, contextMap, strata, node.children);
        });

        // Do not return a value - this indicates it operates in place
        return;
    }

    function UpdateNodeNameDescObjectWithGeneratedName(nameMap: NodeNameMap, contextMap: NodeNameContextMap, strata: ReadonlyArray<IStratum>, node: AnnealNode.Node) {
        // Get the name description object for this node
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
        const contextNameCountTrackingObject = contextMap[stratumNamingContext];

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
            const { type, stratumLabel, nodeGeneratedName } = nameDesc;

            if (nodeGeneratedName === undefined) {
                throw new Error("No generated name found for record node");
            }

            // Accumulate name
            const name = [...accumulatedName, { type, stratumLabel, nodeGeneratedName }];

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
