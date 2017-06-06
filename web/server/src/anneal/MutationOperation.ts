import * as Util from "../core/Util";

import { AnnealStratum } from "./AnnealStratum";

// Returns pointers to indices which were modified and will require cost
// recalculation
export type OpFunction = (stratum: AnnealStratum) => ReadonlyArray<number>;

export interface OpProbability {
    readonly operation: OpFunction,
    readonly probability: number,
}


export namespace Nop {
    export const execute: OpFunction =
        () => {
            // Do nothing
            return [];
        }
}

export namespace SwapChildrenBetweenStratumNodes {
    export const execute: OpFunction =
        (stratum) => {
            return stratum.randomSwapRecordPointersBetweenNodes();
        }
}

export const defaultOpDistribution: ReadonlyArray<OpProbability> = [
    {
        operation: SwapChildrenBetweenStratumNodes.execute,
        probability: 1.0
    },
    // {
    //     operation: Nop.execute,
    //     probability: 0.0
    // },
]

export const randomOpGenerator =
    (opProbs: ReadonlyArray<OpProbability>) => {
        const probabilities = opProbs.map(x => x.probability);
        const operations = opProbs.map(x => x.operation);

        const getRandomIndex = Util.randUint32DistGenerator(probabilities);
        return () => operations[getRandomIndex()];
    }

export const randPick = randomOpGenerator(defaultOpDistribution);
