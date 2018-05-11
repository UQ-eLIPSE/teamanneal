<template>
    <div class="move-person">
        <h2>Move</h2>
        <div class="form-block">
            <label for="source-person-select">Move:</label>
            <div class="click-input-field-block"
                 :class="sourcePersonFieldBlockClasses">
                <button id="source-person-select"
                        class="input-field"
                        data-placeholder-text="(Person)"
                        @focus="setCursor('sourcePerson')"
                        @click="setCursor('sourcePerson')">{{ sourcePersonFieldBlockText }}</button>
                <!-- <button v-if="data.sourcePerson !== undefined">View</button> -->
                <button v-if="data.sourcePerson !== undefined"
                        @click="clearSourcePerson">Clear</button>
            </div>
        </div>
        <div class="form-block">
            <label for="target-group-select">... to:</label>
            <div class="click-input-field-block"
                 :class="targetGroupFieldBlockClasses">
                <button id="target-group-select"
                        class="input-field"
                        data-placeholder-text="(Group)"
                        @focus="setCursor('targetGroup')"
                        @click="setCursor('targetGroup')">{{ targetGroupFieldBlockText }}</button>
                <!-- <button v-if="data.targetGroup !== undefined">View</button> -->
                <button v-if="data.targetGroup !== undefined"
                        @click="clearTargetGroup">Clear</button>
            </div>
        </div>
        <div v-if="sortedTestPermutationData !== undefined && data.cursor === 'targetGroup'"
             class="test-permutations">
            <h3 v-if="sortedTestPermutationData.length > 0">Suggestions</h3>
            <ul class="suggestions">

                <li v-for="x in sortedTestPermutationData"
                    class="suggestion"
                    :key="x.toNode"
                    @click="setTargetGroup(x.toNode)">
                    <span :title="getAncestors(x.toNode).join(' > ')"
                          class="ancestors">{{ getAncestors(x.toNode).join(" > ") }}</span>
                    <!-- <span>{{ nodeToNameMap[x.toNode] }}</span> -->
                    <span class="content improvement"
                          :class="getSatisfactionChangeClass(x.satisfaction.value)">Satisfaction: {{ getSatisfactionPercentChangeFormatted(x.satisfaction.value)}}</span>
                    <!-- <span class="content">{{ x.satisfaction.value }}/{{ x.satisfaction.max }}</span> -->
                </li>
            </ul>
            <button class="button secondary small"
                    @click="clearSatisfactionTestPermutationData">Close suggestions</button>
        </div>
        <div class="form-block">
            <button class="button secondary small"
                    @click="onGetSuggestionsButtonClick">Get suggestions</button>
            <button class="button secondary small">Advanced...</button>
        </div>
        <div class="form-block"
             style="text-align: right;">
            <button class="button small"
                    @click="commitMove">Move</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { ResultsEditor as S } from "../../store";

import { MoveSidePanelToolData } from "../../data/MoveSidePanelToolData";
import * as SatisfactionTestPermutationRequest from "../../data/SatisfactionTestPermutationRequest";

import { MoveRecordTestPermutationOperationResult } from "../../../../common/ToClientSatisfactionTestPermutationResponse";
import { GroupNode } from "../../data/GroupNode";

@Component
export default class Move extends Vue {
    /** Token for each run of the test permutation request */
    p_testPermutationRequestToken: string | undefined = undefined;

    /** Data returned from test permutation request */
    p_testPermutationData: MoveRecordTestPermutationOperationResult | undefined = undefined;

    get data() {
        return (S.state.sideToolArea.activeItem!.data || {}) as MoveSidePanelToolData;
    }

    get sourcePersonFieldBlockClasses() {
        return {
            "active": this.data.cursor === "sourcePerson",
        };
    }

    get targetGroupFieldBlockClasses() {
        return {
            "active": this.data.cursor === "targetGroup",
        };
    }

    get sourcePersonFieldBlockText() {
        return this.data.sourcePerson && this.data.sourcePerson.id;
    }

    get targetGroupFieldBlockText() {
        const target = this.data.targetGroup && this.data.targetGroup;
        if(target === undefined) return target;
        return this.getAncestors(target).join(" > ");
    }

    get sortedTestPermutationData() {
        const data = this.p_testPermutationData;

        if (data === undefined) {
            return undefined;
        }

        // This sorts in reverse order: higher satisfactions are located at the 
        // start index
        return [...data].sort((a, b) => (b.satisfaction.value / b.satisfaction.max) - (a.satisfaction.value / a.satisfaction.max));
    }

    get nodeToNameMap() {
        return S.state.groupNode.nameMap;
    }

    async setCursor(target: "sourcePerson" | "targetGroup" | undefined) {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { cursor: target });
    }

    async clearSourcePerson() {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { sourcePerson: undefined });
        await this.setCursor("sourcePerson");
    }

    async clearTargetGroup() {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { targetGroup: undefined });
        await this.setCursor("targetGroup");
    }

    async commitMove() {
        const { sourcePerson, targetGroup } = this.data;

        if (sourcePerson === undefined || targetGroup === undefined) {
            // TODO: Proper error handling
            throw new Error("Underspecified move operation");
        }

        await S.dispatch(S.action.MOVE_RECORD_TO_GROUP_NODE, { sourcePerson, targetGroup });

        // TODO: Review whether we should close the side panel or not
        await S.dispatch(S.action.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
    }

    async fetchSatisfactionTestPermutationData() {
        const sourcePerson = this.data.sourcePerson;

        if (sourcePerson === undefined) {
            return;
        }

        const { node: nodeId, id: recordId } = sourcePerson;

        // Need to clip anneal nodes to just the partition containing the person
        // to be moved around
        //
        // NOTE: If in future move test operations support multiple partitions,
        // then this should be removed and no filter applied to anneal nodes
        const rootNodeToChildNodesMap = S.get(S.getter.GET_PARTITION_NODE_MAP);
        const rootNodeId = Object.keys(rootNodeToChildNodesMap).find(id => rootNodeToChildNodesMap[id].indexOf(nodeId) > -1)

        // Build up request body

        // Only get the partition/root node that this node is sitting under
        const annealNodes = S.get(S.getter.GET_COMMON_ANNEALNODE_ARRAY).filter(node => node._id === rootNodeId);

        const columns = S.get(S.getter.GET_COMMON_COLUMN_DESCRIPTOR_ARRAY);
        const records = S.get(S.getter.GET_RECORD_COOKED_VALUE_ROW_ARRAY);
        const strata = S.get(S.getter.GET_COMMON_STRATA_DESCRIPTOR_ARRAY_IN_SERVER_ORDER);
        const constraints = S.get(S.getter.GET_COMMON_CONSTRAINT_DESCRIPTOR_ARRAY);
        const operation = { fromNode: nodeId, recordId, };

        const requestBody = SatisfactionTestPermutationRequest.packageRequestBody({ columns, records, }, strata, constraints, annealNodes, operation);
        const { request, token } = SatisfactionTestPermutationRequest.createRequest("move-record", requestBody);

        // Set this component's token reference so that we can identify if 
        // there's been further requests down the line
        this.p_testPermutationRequestToken = token;

        // Wait for response
        const response = await request;

        // Check that the token is the same as before
        if (this.p_testPermutationRequestToken !== token) {
            // Ignore if there has been a further test permutation request that
            // was fired after
            return;
        }

        // Set response data
        this.p_testPermutationData = response.data;
    }

    clearSatisfactionTestPermutationData() {
        this.p_testPermutationData = undefined;
    }

    onGetSuggestionsButtonClick() {
        this.clearSatisfactionTestPermutationData();
        this.fetchSatisfactionTestPermutationData();
    }

    setTargetGroup(targetNodeId: string) {
        S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { targetGroup: targetNodeId });
    }

    getAncestors(nodeId: string) {
        const childToParentNodeMap = this.childToParentNodeMap;
        const parentageArray = [];
        let childId: string | null = nodeId;
        do {
            parentageArray.push(childId);
            childId = childToParentNodeMap[childId];
        } while (childId !== null);

        const nodeNameMap = S.state.groupNode.nameMap;
        const names = parentageArray.map((nodeId: string) => nodeNameMap[nodeId]);
        return names.reverse();
    }

    getParentage(childToParentNodeMap: { [nodeId: string]: string | null }, node: GroupNode) {
        if (node.type === "root") {
            childToParentNodeMap[node._id] = null;
        }

        if (node.type === "intermediate-stratum" || node.type === "root") {
            node.children.forEach((child) => {
                childToParentNodeMap[child._id] = node._id;
                this.getParentage(childToParentNodeMap, child);
            });
        }
    }

    get childToParentNodeMap() {
        const nodeRoots = S.state.groupNode.structure.roots;
        const childToParentNodeMap: { [nodeId: string]: string | null } = {};
        nodeRoots.forEach((root) => this.getParentage(childToParentNodeMap, root))
        return childToParentNodeMap;
    }

    get currentConfigurationSatisfactionValue() {
        const sourcePerson = this.data.sourcePerson;
        if (sourcePerson === undefined) return undefined;

        const selectedNodeId = sourcePerson.node;
        const sortedTestPermutationData = this.sortedTestPermutationData;

        if (sortedTestPermutationData === undefined) {
            return undefined;
        }

        const satisfactionObject = sortedTestPermutationData.find((p) => p.toNode === selectedNodeId);

        return satisfactionObject === undefined ? undefined : { value: satisfactionObject.satisfaction.value, max: satisfactionObject.satisfaction.max };
    }

    getSatisfactionPercentChange(satisfactionValue: number) {
        const satisfactionObject = this.currentConfigurationSatisfactionValue;
        if (satisfactionObject === undefined) {
            return;
        }

        const percentChange = ((satisfactionValue - satisfactionObject.value) / satisfactionObject.max) * 100;

        return percentChange;
    }

    getSatisfactionPercentChangeFormatted(satisfactionValue: number) {
        const percentChange = this.getSatisfactionPercentChange(satisfactionValue);
        if (percentChange === undefined) return;

        if (percentChange >= 0) {
            return "+" + percentChange + "%";
        }

        return percentChange + "%";
    }

    getSatisfactionChangeClass(satisfactionValue: number) {
        const classes = [];
        const percentChange = this.getSatisfactionPercentChange(satisfactionValue);

        if (percentChange === undefined) return;

        if (percentChange >= 0) {
            classes.push("positive");
        } else if (percentChange < 0) {
            classes.push("negative");
        }

        return classes;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>
.test-permutations {
    background: rgba(220, 220, 220, 1);
    padding: 0.5rem;
}

.test-permutations > h3 {
    color: #49075E;
    font-style: italic;
}

.suggestions {
    display: flex;
    flex-flow: column;
    list-style-type: none;
    padding: 0;
    margin: 0;
    overflow: auto;
    height: 12rem;
}

.suggestion {
    display: flex;
    flex-direction: column;
    background: #fefefe;
    border: 0.1em solid rgba(1, 0, 0, 0.1);
    overflow: auto;
    cursor: pointer;
    flex-shrink: 0;
    margin: 0.5rem 0;
}

.suggestion .ancestors {
    background: #49075e;
    color: #fff;
    text-overflow: ellipsis;
    padding: 0.5rem;
}

.suggestion .content {
    padding: 0.5rem;
}

.positive {
    background: rgba(53, 146, 56, 0.2);
}

.negative {
    background: rgba(171, 39, 45, 0.2);
}
</style>
