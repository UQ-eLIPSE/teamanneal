import * as Util from "../core/Util";
import * as Logger from "../core/Logger";

import * as AnnealNode from "../data/AnnealNode";


const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);


export type OpFunction = (stratumNodes: ReadonlyArray<AnnealNode.AnnealNode>) => void;

export interface OpProbability {
    readonly operation: OpFunction,
    readonly probability: number,
}


export namespace Nop {
    export const execute: OpFunction =
        () => {
            // Do nothing
            return;
        }
}

export namespace SwapChildrenBetweenStratumNodes {
    export const execute: OpFunction =
        (stratumNodes) => {
            // NOTE: Remember that leaves (person/student records) are not
            // passed in as strata!

            // We need at least two stratum nodes 
            const nodesLength = stratumNodes.length;
            if (nodesLength < 2) {
                // Do nothing
                log("warn")("SwapChildrenBetweenStratumNodes: At least two stratum nodes required for children swap");
                return;
            }

            // Pick two stratum nodes, regardless of whether they have a common
            // parent
            const [nodeA, nodeB] = Util.randPickTwoElements(stratumNodes);

            // Pick child of each of (A,B) => childA, childB
            const childA = AnnealNode.pickRandomChild(nodeA);
            const childB = AnnealNode.pickRandomChild(nodeB);

            if (childA === undefined || childB === undefined) {
                throw new Error("Either one or both of `childA` or `childB` is undefined");
            }

            // Swap children between (A,B)
            log("debug")(`Swapping nodes ${childA.id} and ${childB.id}`);
            AnnealNode.swapNodes(childA, childB);

            return stratumNodes;
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
