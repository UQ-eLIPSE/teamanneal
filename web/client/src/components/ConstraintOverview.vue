<template>
    <div class="constraint-overview">
        <h2>Constraints Overview</h2>
        <div class="constraints-container">
            <!-- TODO: Decide what `getConstraintFulfilledPercentage` returns -->
            <div class="stratum"
                 v-for="stratum in strata"
                 :key="stratum._id">
                <h2>{{stratum.label}} Constraints</h2>
                <!-- <ConstraintAcceptabilityCard v-for="constraint in getConstraintsArrayByStratum(stratum)"
                                                                                                                                                                     class="card"
                                                                                                                                                                     :key="constraint._id"
                                                                                                                                                                     :fulfilledNumber="getFulfilledNumberOfGroups(constraint)"
                                                                                                                                                                     :totalGroups="getNumberOfGroupsWithConstraintApplicable(constraint)"
                                                                                                                                                                     @constraintAcceptabilityChanged="constraintAcceptabilityChangeHandler"
                                                                                                                                                                     :stratumLabel="getStratumLabel(constraint)"
                                                                                                                                                                     :constraintThreshold="getConstraintThreshold(constraint)"
                                                                                                                                                                     :constraint="constraint"> </ConstraintAcceptabilityCard>
                                                                                                                                                                      -->
                <ConstraintAcceptabilityCard v-for="constraint in getConstraintsArrayByStratum(stratum)"
                                             class="card"
                                             :key="constraint._id"
                                             :fulfilledNumber="getFulfilledNumberOfGroups(constraint)"
                                             :totalGroups="getNumberOfGroupsWithConstraintApplicable(constraint)"
                                             :stratumLabel="getStratumLabel(constraint)"
                                             :constraint="constraint"> </ConstraintAcceptabilityCard>
            </div>

        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, p, Lifecycle } from "av-ts";
// import { Data as IState } from "../data/State";
import { Data as IConstraint } from "../data/Constraint";
// import { Data as IStratum } from "../data/Stratum";
import { SatisfactionMap } from "../../../common/ConstraintSatisfaction";
import { Data as IStratum } from "../data/Stratum";
import ConstraintAcceptabilityCard from "./ConstraintAcceptabilityCard.vue";
import * as AnnealNode from "../../../common/AnnealNode";
import { Record, RecordElement } from "../../../common/Record";

@Component({
    components: {
        ConstraintAcceptabilityCard
    }
})
export default class ConstraintOverview extends Vue {
    @Prop constraintSatisfactionMap = p<SatisfactionMap>({ required: true, });

    @Prop constraints = p<IConstraint[]>({ required: true });

    /** Constraint to indicate as "selected" */
    @Prop selectedConstraint = p<IConstraint>({ required: false, });

    @Prop strata = p<IStratum[]>({ required: true });

    @Prop nodeRoots = p<ReadonlyArray<AnnealNode.NodeRoot>>({ type: Array, required: true, });

    @Prop recordLookupMap = p<Map<RecordElement, Record>>({ required: true, });

    @Prop columns = p<any>({ required: true });
    /**
     * Returns constraints applicable to currently selected stratum
     */
    get constraintsArray() {
        return this.constraints;
    }

    // getFulfilledNumberOfGroups(constraint: IConstraint) {
    //     const nodesUnderConstraint = this.constraintToNodeMap[constraint._id];
    //     const count = nodesUnderConstraint.filter((nodeId) => (this.constraintSatisfactionMap[nodeId][constraint._id] as number) * 100 >= this.getConstraintThreshold(constraint)).length;
    //     return count;
    // }

    getFulfilledNumberOfGroups(constraint: IConstraint) {
        const nodesUnderConstraint = this.constraintToNodeMap[constraint._id];
        const count = nodesUnderConstraint.filter((nodeId) => (this.constraintSatisfactionMap[nodeId][constraint._id] as number) === 1).length;
        return count;
    }

    // getConstraintThreshold(constraint: IConstraint) {
    //     return this.constraintThresholdMap[constraint._id];
    // }
    getNumberOfGroupsWithConstraintApplicable(constraint: IConstraint) {
        return this.constraintToNodeMap[constraint._id].length;
    }

    getStratumLabel(constraint: IConstraint) {
        return this.strata.find((stratum) => stratum._id === constraint.stratum)!.label;
    }

    get constraintToNodeMap() {
        const csMap = this.constraintSatisfactionMap;

        return Object.keys(csMap).reduce<{ [constraintId: string]: string[] }>((carry, nodeId) => {
            const nodeSatisfaction = csMap[nodeId];

            Object.keys(nodeSatisfaction).forEach((constraintId) => {
                let constraintToNodeArray = carry[constraintId];

                if (constraintToNodeArray === undefined) {
                    constraintToNodeArray = (carry[constraintId] = []);
                }

                constraintToNodeArray.push(nodeId);
            });

            return carry;
        }, {});
    }

    isConstraintSelected(constraint: IConstraint) {
        if (this.selectedConstraint === undefined) {
            return false;
        }

        return this.selectedConstraint._id === constraint._id;
    }

    /**
     * Handles `constraintSelected` event emitted from 
     * `ConstraintSatisfactionDashboardConstraint` component.
     */
    onConstraintSelected(constraint: IConstraint) {
        this.$emit("constraintSelected", constraint);
    }

    // constraintAcceptabilityChangeHandler(constraint: IConstraint, newValue: number) {
    //     this.$emit("constraintAcceptabilityChanged", constraint, newValue);
    // }

    getConstraintsArrayByStratum(stratum: IStratum) {
        return this.constraintsArray.filter((constraint) => constraint.stratum === stratum._id);
    }

    getNodesWithConstraintApplicable(constraint: IConstraint) {
        return this.constraintToNodeMap[constraint._id];
    }

    getAllRecords(node: AnnealNode.Node, records: any) {
        if (node.type !== "stratum-records") {
            node.children.forEach((child) => {
                this.getAllRecords(child, records);
            });
        } else {
            records.push(...node.recordIds);
        }
    }
    getAllRecordsInNode(node: AnnealNode.Node) {
        let records: any = [];
        this.getAllRecords(node, records);
        return records;
    }

    findNodes(node: AnnealNode.Node, nodeIds: string[], nodeIdNodeMap: any) {

        if (nodeIds.indexOf(node._id) !== -1) {
            nodeIdNodeMap[node._id] = node;
            return;
        }
        if (node.type !== "stratum-records") {
            node.children.forEach((c) => this.findNodes(c, nodeIds, nodeIdNodeMap));
        }
    }
    getNodesFromNodeIds(nodeIds: string[]) {
        let nodeIdNodeMap = {};
        this.nodeRoots.forEach((root) => {
            root.children.forEach((c) => {
                this.findNodes(c, nodeIds, nodeIdNodeMap);
            })
        });

        return nodeIdNodeMap;
    }


    getLimitConstraintNodeRecordsMap() {
        const limitConstraints = this.constraintsArray.filter((c) => c.type === "limit");

        const res = limitConstraints.map((lc) => {
            const nodeIds: string[] = this.getNodesWithConstraintApplicable(lc);

            const nodeIdToNodeMap: { [key: string]: AnnealNode.Node } = this.getNodesFromNodeIds(nodeIds);

            const nodeToRecords = Object.keys(nodeIdToNodeMap).map((id: string) => {
                const recordsInNode = this.getAllRecordsInNode(nodeIdToNodeMap[id]);

                return ({ node: nodeIdToNodeMap[id], records: recordsInNode, constraint: lc });
            });

            return nodeToRecords;
        });
        return res;
    }

    getRecordById(recordId: string) {
        return this.recordLookupMap.get(recordId);
    }
    getPigeonHolesForConstraints() {
        const limitConstraintArray = this.getLimitConstraintNodeRecordsMap();
        // E.g. Team should have as many people with Discipline equal to Software when team has any number of people
        // Pigeons -> E.g. Records with discipline equal to software
        // let pigeons = 0;s
        // Holes -> E.g. Total number of Teams
        // let holes;
        const constraintNodeArray: any = [];
        limitConstraintArray.forEach((lc) => {
            const pigeonNodeMap: any = {};

            lc.forEach((node: any) => {
                const records = node.records.map((recordId: string) => ({ id: recordId, data: this.getRecordById(recordId) }))
                const filteredRecordsLength = records.filter((record: any) => {
                    const constraintLabel = (node.constraint as IConstraint).filter.column.label;
                    const value = (node.constraint as any).filter.values[0];
                    const col = this.columns.find((c: any) => c.label === constraintLabel);
                    if (record.data[this.columns.indexOf(col)] === value) return true;
                }).length;
                pigeonNodeMap[node.node._id] = filteredRecordsLength;

            });
            constraintNodeArray.push({ pigeonNodeMap: pigeonNodeMap, holes: Object.keys(pigeonNodeMap).length });
        });
        return constraintNodeArray;
    }
    @Lifecycle
    created() {
        // const map = this.nodeToRecordsMap;

        // console.log('NODE TO RECORD MAP :');
        // console.log(map);
        // const constraintNodeArray = this.getPigeonHolesForConstraints();
        // constraintNodeArray.forEach((pigeonHoleObject: any) => {
        //     const pigeons = Object.keys(pigeonHoleObject.pigeonNodeMap).map((nodeId: string) => pigeonHoleObject.pigeonNodeMap[nodeId]).reduce((totalSum: number, numPigeons: number) => totalSum + numPigeons);

        //     console.log('---------------');
        //     console.log('Number of pigeons:' + pigeons);
        //     console.log('Number of holes:' + pigeonHoleObject.holes);
        //     if (pigeonHoleObject.holes > pigeons) {
        //         console.log('Check that no hole should have > 1 pigeon');
        //         const satisfied = Object.keys(pigeonHoleObject.pigeonNodeMap).filter((hole: string) => pigeonHoleObject.pigeonNodeMap[hole] <= 1);
        //         // console.log('PigeonHoleObject : ');
        //         // console.log(pigeonHoleObject);
        //         console.log('Satisfied groups: ' + satisfied.length);
        //     } else if (pigeonHoleObject.holes < pigeons) {
        //         console.log('Check that all holes have >=MIN and <=MAX');
        //         const MIN = Math.floor(pigeons / pigeonHoleObject.holes);
        //         const MAX = MIN + 1;
        //         console.log('MIN : ' + MIN + ' | MAX: ' + MAX);
        //         const satisfied = Object.keys(pigeonHoleObject.pigeonNodeMap).filter((hole: string) => pigeonHoleObject.pigeonNodeMap[hole] >= MIN && pigeonHoleObject.pigeonNodeMap[hole] <= MAX);
        //         // console.log('PigeonHoleObject : ');
        //         // console.log(pigeonHoleObject);
        //         console.log('Satisfied groups: ' + satisfied.length);

        //     } else {
        //         console.log('Each hole should have exactly one pigeon');
        //         const satisfied = Object.keys(pigeonHoleObject.pigeonNodeMap).filter((hole: string) => pigeonHoleObject.pigeonNodeMap[hole] === 1);
        //         // console.log('PigeonHoleObject : ');
        //         // console.log(pigeonHoleObject);
        //         console.log('Satisfied groups: ' + satisfied.length);

        //     }
        //     console.log('Total groups: ' + pigeonHoleObject.holes);

        // });
    }

}
</script>


<style scoped>
.constraint-overview {
    display: flex;
    align-items: center;
    flex-direction: column;
    background: rgba(245, 245, 245, 0.9);
    overflow-y: scroll;
}

h2 {
    color: #49075E;
}

.constraints-container {
    display: flex;
    flex-direction: column;
    padding: 0.5em;
}

.constraints-container>* {
    margin: 0.1rem 0 0.1rem 0;
}

.card {
    margin: 0.5rem 0;
}
</style>
