/*
 * AnnealThread
 * 
 * 
 */
import * as Constraint from "./Constraint";
import * as Partition from "./Partition";
import * as Anneal from "./Anneal";
import * as CostFunction from "./CostFunction";
import * as ColumnInfo from "./ColumnInfo";

import * as Util from "../core/Util"; 



export interface MessageFormat {
    event: string,
    data: any,
}

export interface AnnealConfiguration {
    id: number,
    constraints: Constraint.Constraint[],
    columnInfo: ColumnInfo.ColumnInfo,
}

export interface AnnealInput {
    partition: Partition.Partition,
}

export interface AnnealThreadResult {
    thread: {
        id: number,
    },

    result: Anneal.AnnealIterationResult,

    time: {
        start: number,
        end: number,
        executionMs: number,
    }
}




// Worker configuration
let id: number | undefined;
let constraints: Constraint.Constraint[] | undefined;
let columnInfo: ColumnInfo.ColumnInfo | undefined;

let appliedRecordSetCostFunctions: CostFunction.AppliedRecordSetCostFunction[] | undefined;



// Thread messaging 
const msgParent = (message: MessageFormat) => {
    // TODO: Probably should fix this to stop using the wrong types for postMessage
    return (postMessage as any)(message);
}

export const setup = () => {
    onmessage = (e) => {
        const message: MessageFormat = e.data;

        const { event, data } = message;

        switch (event) {
            case "configure": {
                id = data.id;
                constraints = data.constraints;
                columnInfo = data.columnInfo;

                // Cache cost functions
                appliedRecordSetCostFunctions = CostFunction.generateAppliedRecordSetCostFunctions(columnInfo!)(constraints!);

                // Notify parent
                return msgParent({
                    event: "configureOkay",
                    data: null,
                });
            }

            case "anneal": {
                const partition: Partition.Partition = data.partition;

                // Run anneal
                const resultData = anneal(partition);

                return msgParent({
                    event: "annealResult",
                    data: resultData,
                });
            }
        }
    }

    // Notify parent
    msgParent({
        event: "ready",
        data: null,
    });
}

const anneal =
    (partition: Partition.Partition) => {
        const timerStart = Util.timer();
        const startTimestamp = Util.timestamp();

        if (id === undefined) {
            throw new Error(`No ID set in thread`);
        }

        if (!constraints) {
            throw new Error(`No constraints set in thread ${id}`);
        }

        if (!columnInfo) {
            throw new Error(`No column info set in thread ${id}`);
        }

        if (!appliedRecordSetCostFunctions) {
            throw new Error(`No cost functions precomputed in thread ${id}`);
        }


        const result = Anneal.run(appliedRecordSetCostFunctions)(partition);

        const resultData: AnnealThreadResult = {
            thread: {
                id,
            },

            result,

            time: {
                start: startTimestamp,
                end: Util.timestamp(),
                executionMs: Util.timer(timerStart),
            },
        }

        return resultData;
    }
