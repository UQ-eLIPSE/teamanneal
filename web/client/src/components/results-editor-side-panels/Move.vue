<template>
    <div class="move-person">
        <h2>Move</h2>
        <div class="form-block">
            <p>To move a member:</p>
            <ul>
                <li>Click on the "Move" field below</li>
                <li>Select the desired {{ lowestLevelStratumLabel }} member from the table</li>
                <li>Click on the "to" field</li>
                <li>Select the desired {{ lowestLevelStratumLabel }} from the table or suggestion list</li>
                <li>Click on "MOVE"</li>
            </ul>
        </div>

        <div class="form-block">
            <label class="operation-label" for="source-person-select">Move:</label>
            <div class="click-input-field-block"
                 :class="sourcePersonFieldBlockClasses">
                <button id="source-person-select"
                        class="input-field"
                        v-bind:data-placeholder-text="this.data.cursor === 'sourcePerson' ? `(Select a ${lowestLevelStratumLabel} member from table)` : `(Click here to set ${lowestLevelStratumLabel} member)`"
                        @focus="setCursor('sourcePerson')"
                        @click="setCursor('sourcePerson')">{{ sourcePersonFieldBlockText }}</button>
                <!-- <button v-if="data.sourcePerson !== undefined">View</button> -->
                <button v-if="data.sourcePerson !== undefined"
                        @click="clearSourcePerson">Clear</button>
            </div>
        </div>
        <div class="form-block">
            <label  class="operation-label" for="target-group-select">... to:</label>
            <div class="click-input-field-block"
                 :class="targetGroupFieldBlockClasses">
                <button id="target-group-select"
                        class="input-field"
                        v-bind:data-placeholder-text="this.data.cursor === 'targetGroup' ? `(Select a ${lowestLevelStratumLabel} from table or suggestions list)` : `(Click here to select ${lowestLevelStratumLabel})`"
                        @focus="setCursor('targetGroup')"
                        @click="setCursor('targetGroup')">{{ targetGroupFieldBlockText }}</button>
                <!-- <button v-if="data.targetGroup !== undefined">View</button> -->
                <button v-if="data.targetGroup !== undefined"
                        @click="clearTargetGroup">Clear</button>
            </div>
        </div>


        <MoveSuggestionsDisplay @groupSelected="setTargetGroup"
                                @closeSuggestions="clearSatisfactionTestPermutationData"
                                :data="data"
                                :sortedTestPermutationData="sortedTestPermutationData" @clearSuggestions="clearSatisfactionTestPermutationData"></MoveSuggestionsDisplay>

        <div class="form-block">
            <button class="button secondary small"
                    @click="onGetSuggestionsButtonClick">Get suggestions</button>
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
import { Vue, Component, Watch } from "av-ts";

import { ResultsEditor as S } from "../../store";

import { MoveSidePanelToolData } from "../../data/MoveSidePanelToolData";
import * as SatisfactionTestPermutationRequest from "../../data/SatisfactionTestPermutationRequest";
import { NotificationPayload } from "../../data/Notification";
import { notifySystem } from "../../util/NotificationEventBus";

import { MoveRecordTestPermutationOperationResult } from "../../../../common/ToClientSatisfactionTestPermutationResponse";
import MoveSuggestionsDisplay from "../MoveSuggestionsDisplay.vue";
import { Suggestions } from "../../data/Suggestions";

@Component({
    components: {
        MoveSuggestionsDisplay
    }
})
export default class Move extends Vue {
    /** Token for each run of the test permutation request */
    p_testPermutationRequestToken: string | undefined = undefined;

    /** Data returned from test permutation request */
    p_testPermutationData: MoveRecordTestPermutationOperationResult | undefined = undefined;

    /** The placeholder text when interacting with the person form */
    personInputFocused: boolean = false;
    groupInputFocused: boolean = false;

    /** Watches side panel data in store and updates suggestions automatically */
    @Watch('data')
    handler(newVal: MoveSidePanelToolData, oldVal: MoveSidePanelToolData) {
        
        if(newVal && newVal.sourcePerson) {
            if(oldVal && oldVal.sourcePerson) {
                if(oldVal.sourcePerson.node !== newVal.sourcePerson.node) {
                    this.onGetSuggestionsButtonClick();
                }
            } else {
                this.onGetSuggestionsButtonClick();
            }
        }
    }

    get data() {
        return (S.state.sideToolArea.activeItem!.data || {}) as MoveSidePanelToolData;
    }

    get lowestLevelStratumLabel() {
        return  S.state.strataConfig.strata.length > 0 ? S.state.strataConfig.strata[S.state.strataConfig.strata.length - 1].label : "";
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
        if (target === undefined) return target;
        return Suggestions.getAncestors(target).join(" > ");
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

        // Check to see if the move has failed
        try {
            if (sourcePerson === undefined || targetGroup === undefined) {
                throw new Error("Underspecified move operation");
            }


            await S.dispatch(S.action.MOVE_RECORD_TO_GROUP_NODE, { sourcePerson, targetGroup });
            const notifyPacket = {
                title: "Move",
                message: " Member moved to " + S.state.groupNode.nameMap[targetGroup],
                options: {
                    duration: 5000,
                    mode: "success"
                }
            } as NotificationPayload;

            notifySystem(notifyPacket);

            
            // Dispatch clear if we were successful in moving
            // TODO: Review whether we should close the side panel or not
            await S.dispatch(S.action.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
            
            // Recalculate satisfaction after successful move operation
            await S.dispatch(S.action.CALCULATE_SATISFACTION, undefined);
        } catch(e) {
            const err = e as Error;

            const notifyPacket = {
                title: "Move",
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

}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>
.operation-label {
    font-size: 1.1em;
    font-weight: 300;
}
</style>
