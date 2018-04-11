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
        <div class="form-block">
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
import { Vue, Component, Prop, p } from "av-ts";

import * as Store from "../../store";

import { GroupNode } from "../../data/GroupNode";

import { RecordElement } from "../../../../common/Record";

import { set, del } from "../../util/Vue";

interface MoveSidePanelToolData {
    cursor: "sourcePerson" | "targetGroup",
    sourcePerson: { node: GroupNode, id: RecordElement },
    targetGroup: GroupNode,
}

@Component
export default class Move extends Vue {
    @Prop data = p<Partial<MoveSidePanelToolData>>({ required: true, });

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
        return this.data.targetGroup && this.data.targetGroup._id;
    }

    setCursor(target: "sourcePerson" | "targetGroup" | undefined) {
        set(this.data, "cursor", target);
    }

    clearSourcePerson() {
        del(this.data, "sourcePerson");
    }

    clearTargetGroup() {
        del(this.data, "targetGroup");
    }

    async commitMove() {
        const { sourcePerson, targetGroup } = this.data;

        if (sourcePerson === undefined || targetGroup === undefined) {
            // TODO: Proper error handling
            throw new Error("Underspecified move operation");
        }

        await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.MOVE_RECORD_TO_GROUP_NODE, { sourcePerson, targetGroup });

        // TODO: Review whether we should close the move side panel or not
        await Store.ResultsEditor.dispatch(Store.ResultsEditor.action.CLEAR_SIDE_PANEL_ACTIVE_TOOL, undefined);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/results-editor-side-panel.css"></style>

<style scoped>

</style>
