import { CancelTokenSource } from "axios";
import * as Record from "../../../common/Record";
import * as TeamAnnealState from "./TeamAnnealState";
import * as ListCounter from "./ListCounter";
import * as Stratum from "./Stratum";

import axios from "axios";

export function cancelAnnealAjaxRequest(cancelTokenSource: CancelTokenSource | undefined) {
    if (cancelTokenSource !== undefined) {
        cancelTokenSource.cancel();
    }
}

export function createAnnealAjaxRequest(data: any) {
    // Create a cancellation token
    // This is used in event of overlapping requests
    const cancelTokenSource = axios.CancelToken.source();

    const request = axios.post("/api/anneal", data, {
        cancelToken: cancelTokenSource.token,
    });

    return {
        cancelTokenSource,
        request,
    }
}

export function transformOutputIntoTree(outputData: TeamAnnealState.AnnealOutput) {
    // First set of arrays are always partitions

    // Partitions are amalgamated because they're actually not something that is
    // considered for the group structure, only for parallelising anneal
    // requests and ensuring that certain segments of the global group do not 
    // mix together
    const amalgamatedData = outputData.reduce((carry, partition) => carry.concat(partition), []);

    // Go down the result array and convert into basic tree
    // Each level of nested array corresponds to one stratum
    const rootNode = createNodeFromResultArray(amalgamatedData);

    return rootNode;
}

export interface ResultArrayNode {
    label: string | undefined,
    children: ReadonlyArray<ResultArrayNode> | undefined,
    content: Record.Record | undefined,
}

export function createNodeFromResultArray(resultArray: TeamAnnealState.ResultArray): ResultArrayNode {
    // Check if this is a record array by testing the first element
    // Record arrays only have primitives in them (and may be `null`)
    const firstEl = resultArray[0];
    if (firstEl !== undefined && !Array.isArray(firstEl)) {
        const record: Record.Record = resultArray as any[];

        const node: ResultArrayNode = {
            label: undefined,
            children: undefined,
            content: record,
        };

        return node;
    }

    // Recursively call
    const node: ResultArrayNode = {
        label: undefined,
        children: resultArray.map((x: TeamAnnealState.ResultArray) => createNodeFromResultArray(x)),
        content: undefined,
    }

    return node;
}

export function labelTree(rootNode: ResultArrayNode, strata: ReadonlyArray<Stratum.Stratum>) {
    if (rootNode.children === undefined) {
        throw new Error("Root node must have children");
    }

    // Initialise blank arrays in the stratum node collection (one per stratum)
    const stratumNodeCollection: ResultArrayNode[][] = [];
    for (let i = 0; i < strata.length; ++i) {
        stratumNodeCollection.push([]);
    }

    // Go through tree and associate all nodes with their stratum
    rootNode.children.forEach(childNode => binNodeIntoCollection(childNode, stratumNodeCollection, strata.length - 1));

    // Label nodes
    labelNodesInCollection(stratumNodeCollection, strata);
}

export function binNodeIntoCollection(node: ResultArrayNode, collection: ReadonlyArray<ResultArrayNode[]>, stratumIndex: number) {
    // Terminate loop if stratum index is invalid
    if (stratumIndex < 0) { return; }

    // Check that this is not a record (which does not need to be binned)
    if (node.content !== undefined) { return; }

    // Pop this node into the stratum collection
    collection[stratumIndex].push(node);

    // Recurse down
    if (node.children !== undefined) {
        node.children.forEach(childNode => binNodeIntoCollection(childNode, collection, stratumIndex - 1));
    }
}

export function labelNodesInCollection(collection: ReadonlyArray<ResultArrayNode[]>, strata: ReadonlyArray<Stratum.Stratum>) {
    collection.forEach((nodes, stratumIndex) => {
        // We currently get the strata in reverse order because the internal
        // strata object is currently ordered:
        //      [highest, ..., lowest]
        // rather than:
        //      [lowest, ..., highest]
        // which is what the server receives as input to the anneal endpoint.
        // 
        // This is also noted in file: client/data/ConstraintsConfig.ts
        //
        // TODO: Fix up the internal strata object order
        const stratum = strata[strata.length - stratumIndex - 1];
        // const stratum = strata[stratumIndex];

        const counter = stratum.counter;

        // Generate array of counters
        let counterArray: ReadonlyArray<string>;
        if (Array.isArray(counter)) {
            counterArray = counter;     // Counter is an arbitrary string array
        } else {
            const listCounters = ListCounter.SupportedListCounters;
            const counterDesc = listCounters.find(x => x.type === counter);

            if (counterDesc === undefined) {
                throw new Error(`Counter "${counter}" not supported`);
            }

            counterArray = counterDesc.generator(nodes.length);
        }

        // Apply labels to each node in stratum
        const counterArrayLength = counterArray.length;
        const stratumLabel = stratum.label;

        nodes.forEach((node, i) => {
            const counterValue = counterArray[i % counterArrayLength];
            node.label = `${stratumLabel} ${counterValue}`;
        });
    });
}
