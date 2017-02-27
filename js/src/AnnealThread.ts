import * as Config from "./Config";
import * as Constraint from "./Constraint";
import * as Partition from "./Partition";
import * as Anneal from "./Anneal";
import * as Util from "./Util";

export interface MessageFormat {
    event: string,
    data: any,
}

export interface AnnealInput {
    partition: Partition.PartitionWithGroup,
}

export interface AnnealThreadedResult {
    thread: {
        id: number,
    },

    result: AnnealResultInnerInfo,
}

export interface AnnealResultInnerInfo extends Anneal.AnnealRunResult{
    time: {
        start: number,
        end: number,
        executionMs: number,
    }
}

// Worker ID
let id: number | undefined;
let constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>> | undefined;

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

                // Notify parent
                return msgParent({
                    event: "configureOkay",
                    data: null,
                });
            }

            case "anneal": {
                const partition: Partition.PartitionWithGroup = data.partition;

                if (id === undefined) {
                    throw new Error(`No ID set in thread`);
                }

                if (!constraints) {
                    throw new Error(`No constraints set in thread ${id}`);
                }

                const result = anneal(constraints)(partition);

                const resultData: AnnealThreadedResult = {
                    thread: {
                        id,
                    },

                    result,
                }

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
    (constraints: ReadonlyArray<Constraint.Constraint<Config.Constraint>>) =>
        (partition: Partition.PartitionWithGroup) => {
            const timerStart = Util.timer();
            const startTime = Util.timestamp();

            if (id === undefined || constraints === undefined) {
                throw new Error("No ID or constraints set in thread");
            }

            const run = Anneal.run(constraints)(partition);

            return {
                ...run,
                time: {
                    start: startTime,
                    end: Util.timestamp(),
                    executionMs: Util.timer(timerStart),
                }
            }
        }
