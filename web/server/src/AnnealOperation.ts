/*
 * AnnealOperation
 * 
 * 
 */
import * as Partition from "./Partition";
import * as Util from "./Util";
import * as SourceRecordSet from "./SourceRecordSet";




export type OpFunction = (partition: Partition.Partition) => Partition.Partition;

export interface OpProbability {
    readonly operation: OpFunction,
    readonly probability: number,
}






export namespace Nop {
    export const execute: OpFunction =
        (partition) => {
            // Do nothing
            return partition;
        }
}


export namespace SwapRecords {
    export const twoRandomInt =
        (high: number) => {
            const first = Util.randUint32Limit(high);
            let second: number;

            do {
                second = Util.randUint32Limit(high);
            } while (second === first)

            return [first, second];
        }

    export const execute: OpFunction =
        (partition) => {
            const numOfGroups = Partition.size(partition);

            if (numOfGroups < 2) {
                // Can't swap anything if we only have less than 2 groups
                return Nop.execute(partition);
            }

            // Pick the target groups
            const targetGroupIndices = twoRandomInt(numOfGroups);
            const targetGroup1 = Partition.get(partition)(targetGroupIndices[0]);
            const targetGroup2 = Partition.get(partition)(targetGroupIndices[1]);

            // Pick random records from the two
            const r1Index = Util.randUint32Limit(targetGroup1.length);
            const r2Index = Util.randUint32Limit(targetGroup2.length);

            const r1 = SourceRecordSet.get(targetGroup1)(r1Index);
            const r2 = SourceRecordSet.get(targetGroup2)(r2Index);

            // Swap records
            SourceRecordSet.set(targetGroup1)(r1Index)(r2);
            SourceRecordSet.set(targetGroup2)(r2Index)(r1);



            return partition;
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

export const randomOpGenerator =
    (opProbs: ReadonlyArray<OpProbability>) => {
        const probabilities = opProbs.map(x => x.probability);
        const operations = opProbs.map(x => x.operation);

        const getRandomIndex = Util.randUint32DistGenerator(probabilities);
        return () => operations[getRandomIndex()];
    }

export const pickRandomAnnealOperation = randomOpGenerator(defaultOpDistribution);
