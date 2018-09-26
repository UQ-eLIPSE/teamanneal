<template>
    <div class="swap-people">
        <h2>Swap</h2>
        <div class="form-block">
            <label for="person-a-select">Swap:</label>
            <div class="click-input-field-block"
                 :class="personAFieldBlockClasses">
                <button id="person-a-select"
                        class="input-field"
                        data-placeholder-text="(Person)"
                        @focus="setCursor('personA')"
                        @click="setCursor('personA')">{{ personAFieldBlockText }}</button>
                <!-- <button v-if="xxx !== undefined">View</button> -->
                <button v-if="data.personA !== undefined"
                        @click="clearPersonA">Clear</button>
            </div>
        </div>
        <div class="form-block">
            <label for="person-b-select">... with:</label>
            <div class="click-input-field-block"
                 :class="personBFieldBlockClasses">
                <button id="person-b-select"
                        class="input-field"
                        data-placeholder-text="(Person)"
                        @focus="setCursor('personB')"
                        @click="setCursor('personB')">{{ personBFieldBlockText }}</button>
                <!-- <button v-if="xxx !== undefined">View</button> -->
                <button v-if="data.personB !== undefined"
                        @click="clearPersonB">Clear</button>
            </div>
        </div>
        <div v-if="sortedTestPermutationData !== undefined && data.cursor === 'personB'"
             class="test-permutations">
            <ul>
                <li v-for="x in sortedTestPermutationData"
                    :key="x.nodeB + x.recordIdB"
                    @click="setPersonB(x.nodeB, x.recordIdB)">{{ nodeToNameMap[x.nodeB] }}#{{ x.recordIdB }} -> {{ x.satisfaction.value }}/{{ x.satisfaction.max }}</li>
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
                    @click="commitSwap">Swap</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

import { ResultsEditor as S } from "../../store";

import { SwapSidePanelToolData } from "../../data/SwapSidePanelToolData";
import { NotificationPayload } from "../../data/Notification";
import { notifySystem } from "../../util/NotificationEventBus";

import * as SatisfactionTestPermutationRequest from "../../data/SatisfactionTestPermutationRequest";

import { SwapRecordsTestPermutationOperationResult } from "../../../../common/ToClientSatisfactionTestPermutationResponse";

@Component
export default class Swap extends Vue {
    /** Token for each run of the test permutation request */
    p_testPermutationRequestToken: string | undefined = undefined;

    /** Data returned from test permutation request */
    p_testPermutationData: SwapRecordsTestPermutationOperationResult | undefined = undefined;

    get data() {
        return (S.state.sideToolArea.activeItem!.data || {}) as SwapSidePanelToolData;
    }

    get personAFieldBlockClasses() {
        return {
            "active": this.data.cursor === "personA",
        };
    }

    get personBFieldBlockClasses() {
        return {
            "active": this.data.cursor === "personB",
        };
    }

    get personAFieldBlockText() {
        return this.data.personA && this.data.personA.id;
    }

    get personBFieldBlockText() {
        return this.data.personB && this.data.personB.id;
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

    async setCursor(target: "personA" | "personB" | undefined) {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { cursor: target });
    }

    async clearPersonA() {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { personA: undefined });
        await this.setCursor("personA");
    }

    async clearPersonB() {
        await S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { personB: undefined });
        await this.setCursor("personB");
    }

    async commitSwap() {
        const { personA, personB } = this.data;

        // Check to see if the swap has failed
        try {
            
            if (personA === undefined || personB === undefined) {
                throw new Error("Underspecified swap operation");
            }

            await S.dispatch(S.action.SWAP_RECORDS, { personA, personB });
            const notifyPacket = {
                title: "Swap",
                message: " Success",
                options: {
                    duration: 5000,
                    mode: "success"
                }
            } as NotificationPayload;

            notifySystem(notifyPacket);

            // Only close upon successful swap
            // TODO: Review whether we should close the side panel or not
            await S.dispatch(S.action.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);

        } catch(e) {
            const err = e as Error;

            const notifyPacket = {
                title: "Swap",
                message: err.toString(),
                options: {
                    duration: 5000,
                    mode: "error"
                }
            } as NotificationPayload;

            notifySystem(notifyPacket);
        }

    }

    async fetchSatisfactionTestPermutationData() {
        const personA = this.data.personA;

        if (personA === undefined) {
            return;
        }

        const { node: nodeId, id: recordId } = personA;

        // Need to clip anneal nodes to just the partition containing the person
        // to be swapped around
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
        const operation = { nodeA: nodeId, recordIdA: recordId, };

        const requestBody = SatisfactionTestPermutationRequest.packageRequestBody({ columns, records, }, strata, constraints, annealNodes, operation);
        const { request, token } = SatisfactionTestPermutationRequest.createRequest("swap-records", requestBody);

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

    setPersonB(nodeB: string, recordIdB: string) {
        S.dispatch(S.action.PARTIAL_UPDATE_SIDE_PANEL_ACTIVE_TOOL_INTERNAL_DATA, { personB: { node: nodeB, id: recordIdB } });
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
