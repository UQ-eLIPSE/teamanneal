import * as Partition from "./Partition";

import * as Random from "./Random";
import * as Group from "./Group";

import * as Util from "./Util";

export interface OpOutputDetail {
    readonly [key: string]: any,
}

export interface OpOutput {
    readonly name: string,

    readonly partition: Partition.PartitionWithGroup,

    readonly startTime: number,
    readonly endTime: number,
    readonly executionMs: number,

    readonly details: OpOutputDetail | null,
}

export type OpFunction = (partition: Partition.PartitionWithGroup) => OpOutput;

export interface OpProbability {
    readonly operation: OpFunction,
    readonly probability: number,
}



export const randomOpGenerator =
    (opProbs: ReadonlyArray<OpProbability>) => {
        const probabilities = opProbs.map(x => x.probability);
        const operations = opProbs.map(x => x.operation);

        const getRandomIndex = Random.randomIntDistGenerator(probabilities);
        return () => operations[getRandomIndex()];
    }


export namespace Nop {
    export const execute: OpFunction =
        (partition) => {
            // Do nothing
            const timerStart = Util.timer();

            const output: OpOutput = {
                name: "Nop",
                partition,

                startTime: Util.timestamp(),
                endTime: Util.timestamp(),
                executionMs: Util.timer(timerStart),

                details: null,
            }

            return output;
        }
}


export namespace SwapRecords {
    export const twoRandomInt =
        (high: number) => {
            const first = Random.generateRandomIntTo(high);
            let second: number;

            do {
                second = Random.generateRandomIntTo(high);
            } while (second === first)

            return [first, second];
        }

    export const execute: OpFunction =
        (partition) => {
            const timerStart = Util.timer();
            const startTime = Util.timestamp();

            const groups = partition.groups;
            const numOfGroups = groups.length;

            if (numOfGroups < 2) {
                // Can't swap anything if we only have less than 2 groups
                return Nop.execute(partition);
            }

            // Pick the target groups
            const targetGroupIndices = twoRandomInt(numOfGroups);
            const targetGroups = targetGroupIndices.map(i => groups[i]);

            // Pick random records from the two, swap
            const poppedRecords = targetGroups.map(Group.popRandomRecord);
            const newTargetGroups =
                poppedRecords
                    .map(x => x.group)
                    .map(
                    (group, i) => {
                        return Group.insertRecord(group)(poppedRecords[1 - i].popped);
                    }
                    );

            // Replace modified target groups in new copy
            const newGroups = Util.copyArray(groups);
            targetGroupIndices.forEach(
                (targetGroupIndex, i) => {
                    newGroups[targetGroupIndex] = newTargetGroups[i];
                }
            )

            // Create new partition
            const newPartition = Partition.attachGroupsToPartition(partition)(newGroups);

            const output: OpOutput = {
                name: "SwapRecords",
                partition: newPartition,

                startTime,
                endTime: Util.timestamp(),
                executionMs: Util.timer(timerStart),

                details: {
                    swapA: {
                        group: poppedRecords[0].group.name,
                        record: poppedRecords[0].popped,
                    },
                    swapB: {
                        group: poppedRecords[1].group.name,
                        record: poppedRecords[1].popped,
                    }
                }
            }

            return output;
        }
}






export const defaultOpDistribution: ReadonlyArray<OpProbability> = [
    {
        operation: SwapRecords.execute,
        probability: 0.9
    },
    {
        operation: Nop.execute,
        probability: 0.1
    },
]

export const pickRandomAnnealOperation = randomOpGenerator(defaultOpDistribution);
