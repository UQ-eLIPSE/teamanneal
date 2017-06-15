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
    return labelNode(rootNode, strata, 0);
}

export function labelNode(node: ResultArrayNode, strata: ReadonlyArray<Stratum.Stratum>, depth: number) {
    if (node.children !== undefined) {
        // Label this if not root (depth = 0)
        if (depth > 0) {
            const counter = strata[strata.length - depth].counter;

            // TODO: Currently not yet defined
            const index: number = 0;

            // Get counter function
            let label: string;
            if (Array.isArray(counter)) {
                label = counter[index];
            } else {
                const listCounters = ListCounter.SupportedListCounters;
                const counterDesc = listCounters.find(x => x.type === counter);

                if (counterDesc === undefined) {
                    throw new Error(`Counter "${counter}" not supported`);
                }

                label = counterDesc.generator(index + 1)[index];
            }

            node.label = label;
        }

        // Recurse into children
        node.children.forEach((childNode) => {
            labelNode(childNode, strata, depth + 1);
        });

        return;
    }

    if (node.content !== undefined) {
        // Stop - we're at a record which can't be labelled
        return;
    }

    // If none of the above conditions are true, then we don't know what this node thing is
    throw new Error("Unhandled condition; node not recognised");
}
