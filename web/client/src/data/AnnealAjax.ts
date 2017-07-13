import { CancelTokenSource } from "axios";

import * as Record from "../../../common/Record";
import * as Stratum from "../../../common/Stratum";
import * as Constraint from "../../../common/Constraint";
import * as SourceData from "../../../common/SourceData";
import * as SourceDataColumn from "../../../common/SourceDataColumn";
import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";

import * as TeamAnnealState from "./TeamAnnealState";
import * as ListCounter from "./ListCounter";
import * as _Stratum from "./Stratum";
import * as _Constraint from "./Constraint";

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

    // Set the top most node that we created as the root node of a tree we're
    // about to return
    rootNode.isRoot = true;

    return rootNode;
}

export interface ResultArrayNode {
    counterValue: string | number | undefined,
    stratumLabel: string | undefined,
    children: ReadonlyArray<ResultArrayNode> | undefined,
    content: Record.Record | undefined,

    isRoot: boolean,
}

export function createNodeFromResultArray(resultArray: TeamAnnealState.ResultArray): ResultArrayNode {
    // Check if this is a record array by testing the first element
    // Record arrays only have primitives in them (and may be `null`)
    const firstEl = resultArray[0];
    if (firstEl !== undefined && !Array.isArray(firstEl)) {
        const record: Record.Record = resultArray as any[];

        const node: ResultArrayNode = {
            counterValue: undefined,
            stratumLabel: undefined,
            children: undefined,
            content: record,

            isRoot: false,
        };

        return node;
    }

    // Recursively call
    const node: ResultArrayNode = {
        counterValue: undefined,
        stratumLabel: undefined,
        children: resultArray.map((x: TeamAnnealState.ResultArray) => createNodeFromResultArray(x)),
        content: undefined,

        isRoot: false,
    }

    return node;
}

export function labelTree(rootNode: ResultArrayNode, strata: ReadonlyArray<_Stratum.Stratum>) {
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

export function mapRawDataToNodeHierarchy(idColumnIndex: number, node: ResultArrayNode, map = new Map<string, ResultArrayNode[]>(), inputHierarchy: ResultArrayNode[] = []) {
    // We need to copy the array to prevent modifying object from caller
    const hierarchy = inputHierarchy.slice();

    // If node is record, append hierarchy to map and terminate recursion
    if (node.content !== undefined) {
        // Use the ID column as key
        const key = node.content[idColumnIndex];

        if (key === null) {
            throw new Error("Key cannot be null");
        }

        // Keys are normalised to strings
        map.set('' + key, hierarchy);

        return;
    }

    // Otherwise, build up hierarchy array and recurse down
    if (node.children !== undefined) {
        // Push node if not root node
        if (!node.isRoot) {
            hierarchy.push(node);
        }

        node.children.forEach(childNode => mapRawDataToNodeHierarchy(idColumnIndex, childNode, map, hierarchy));
    }

    // Return filled map at end of process
    return map;
}

export function labelNodesInCollection(collection: ReadonlyArray<ResultArrayNode[]>, strata: ReadonlyArray<_Stratum.Stratum>) {
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
            counterArray =
                counter
                    .map(counterString => counterString.trim())
                    .filter(counterString => counterString.length !== 0);

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
            let counterValue = counterArray[i % counterArrayLength];

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

            if (i >= counterArrayLength) {
                const suffix = ((i / counterArrayLength) >>> 0) + 1;
                counterValue += ` ${suffix}`;
            }

            // Set the label right on the node itself
            node.counterValue = counterValue;
            node.stratumLabel = stratumLabel;
        });
    });
}

export function transformStateToAnnealRequestBody($state: Partial<TeamAnnealState.TeamAnnealState>) {
    // ===============
    // Validity checks
    // ===============

    if ($state.sourceFile === undefined) {
        throw new Error("No source file information");
    }

    const sourceFile = $state.sourceFile;

    if ($state.constraintsConfig === undefined) {
        throw new Error("No constraints configuration information");
    }

    const constraintsConfig = $state.constraintsConfig;



    if (sourceFile.cookedData === undefined) {
        throw new Error("No cooked data representation");
    }

    if (sourceFile.columnInfo === undefined) {
        throw new Error("No column information");
    }

    if (constraintsConfig.strata === undefined) {
        throw new Error("No strata");
    }

    if (constraintsConfig.constraints === undefined) {
        throw new Error("No constraints");
    }




    // ====================================
    // Source data (Partitions and columns)
    // ====================================

    // We use the cooked representation not the raw data to send to the server
    // as the values and types are normalised by the client beforehand
    const cookedData = sourceFile.cookedData;
    const columnInfo = sourceFile.columnInfo;

    // Apply partitioning to data records
    const partitionColumnIndex = constraintsConfig.partitionColumnIndex;

    let partitions: SourceData.PartitionedRecordArray;

    if (partitionColumnIndex === undefined) {
        // In the event that there was no partition column set, then we just 
        // wrap the records with an array to pretend we have one partition of
        // all records - this has no difference on the outcome of the anneal
        partitions = [cookedData];
    } else {
        // Partition over values
        const partitionColumnInfo = columnInfo[partitionColumnIndex];
        const columnValueSet: Set<number | string> = partitionColumnInfo.valueSet;

        const tempPartitionSet: any[][] = [];

        // Go through each distinct value to partition
        columnValueSet.forEach((val) => {
            const partition: any[] = [];

            // For each (cooked) data row, check if the cell value of the row in
            // the partition column is equal to the distinct value being cycled 
            // through in the column value forEach loop
            cookedData.forEach((row) => {
                if (row[partitionColumnIndex] === val) {
                    // If so, push into the rows for this partition
                    partition.push(row);
                }
            });

            // Finally we push the partition into the overall partition set
            tempPartitionSet.push(partition);
        });

        partitions = tempPartitionSet;
    }

    // Map the column info objects into just what we need for the request
    const columns: SourceDataColumn.ColumnDescArray = columnInfo.map(
        (column, i) => ({
            label: column.label,
            type: column.type,
            isId: i === constraintsConfig.idColumnIndex,
        })
    );

    // Compile the source data object
    const sourceData: SourceData.Desc = {
        columns,
        records: partitions,
        isPartitioned: true,    // We have partitioned the data above regardless
    }




    // ======
    // Strata
    // ======

    const internalStrata = constraintsConfig.strata;
    const numberOfStrata = internalStrata.length;

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
    let strata: Stratum.Desc[] = [];

    for (let i = numberOfStrata - 1; i >= 0; --i) {
        const internalStratum = internalStrata[i];

        const stratum: Stratum.Desc = {
            label: internalStratum.label,
            size: internalStratum.size,
        }

        strata.push(stratum);
    }



    // ===========
    // Constraints
    // ===========

    const convertConstraintValue = (columnIndex: number, value: Record.RecordElement) => {
        // If the value is a string that terminates with a decimal point and
        // falls under a numeric column, then convert it to a number
        if (typeof value === "string" &&
            value[value.length - 1] === "." &&
            columnInfo[columnIndex].type === "number") {
            return +value;
        }

        return value;
    }

    const constraints: ReadonlyArray<Constraint.Desc> = constraintsConfig.constraints.map(
        (internalConstraint) => {
            // TODO: The below code is copied three times due to TypeScript's
            // strict type checking - it should be combined into one
            switch (internalConstraint.type) {
                case "count": {
                    const constraint: Constraint.Desc = {
                        type: internalConstraint.type,
                        weight: internalConstraint.weight,

                        // TODO: Fix up the internal strata object order
                        strata: numberOfStrata - internalConstraint.strata - 1,

                        filter: {
                            column: internalConstraint.filter.column,
                            function: internalConstraint.filter.function,
                            values: internalConstraint.filter.values
                                .map((value) => convertConstraintValue(internalConstraint.filter.column, value)),
                        },
                        condition: internalConstraint.condition,

                        applicability: internalConstraint.applicability,
                    }

                    return _Constraint.cleanObject(constraint);
                }

                case "limit": {
                    const constraint: Constraint.Desc = {
                        type: internalConstraint.type,
                        weight: internalConstraint.weight,

                        // TODO: Fix up the internal strata object order
                        strata: numberOfStrata - internalConstraint.strata - 1,

                        filter: {
                            column: internalConstraint.filter.column,
                            function: internalConstraint.filter.function,
                            values: internalConstraint.filter.values
                                .map((value) => convertConstraintValue(internalConstraint.filter.column, value)),
                        },
                        condition: internalConstraint.condition,

                        applicability: internalConstraint.applicability,
                    }

                    return _Constraint.cleanObject(constraint);
                }

                case "similarity": {
                    const constraint: Constraint.Desc = {
                        type: internalConstraint.type,
                        weight: internalConstraint.weight,

                        // TODO: Fix up the internal strata object order
                        strata: numberOfStrata - internalConstraint.strata - 1,

                        filter: internalConstraint.filter,
                        condition: internalConstraint.condition,

                        applicability: internalConstraint.applicability,
                    }

                    return _Constraint.cleanObject(constraint);
                }
            }

            throw new Error("Unrecognised constraint type");
        }
    );

    const request: ToServerAnnealRequest.Root = {
        sourceData,
        strata,
        constraints,
        config: {
            // TODO: This entire block is dummy data;
            // The config parameters are currently unused and will be cleaned up in TA-52
            iterations: 0,
            returnAllData: true,
        },
    }

    return request;
}
