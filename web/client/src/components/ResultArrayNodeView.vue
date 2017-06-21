<template>
    <div>
        <ul>
            <template v-if="nodeContainsSubnodes">
                <li>
                    <span v-if="collapsed"
                          @click="toggleCollapsed">[+]</span>
                    <span v-if="!collapsed"
                          @click="toggleCollapsed">[-]</span>
                    {{nodeName}}
                    <div v-if="!collapsed"
                         style="padding-left: 2em;">
                        <ResultArrayNodeView v-for="childNode in nodeChildren"
                                             :node="childNode" />
                    </div>
                </li>
            </template>
            <template v-if="nodeIsRecord">
                <li style="white-space: pre;">{{JSON.stringify(nodeRecord)}}</li>
            </template>
        </ul>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import * as AnnealAjax from "../data/AnnealAjax";

@Component({
    name: "ResultArrayNodeView",
})
export default class ResultArrayNodeView extends Vue {
    // Props
    @Prop node: AnnealAjax.ResultArrayNode = p({ type: Object, required: true, }) as any;

    // Private
    collapsed: boolean = true;

    toggleCollapsed() {
        this.collapsed = !this.collapsed;
    }

    get nodeChildren() {
        return this.node.children;
    }

    get nodeRecord() {
        return this.node.content;
    }

    get nodeName() {
        return this.node.label;
    }

    get nodeContainsSubnodes() {
        return !!this.nodeChildren;
    }

    get nodeIsRecord() {
        return !!this.nodeRecord;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
ul,
li {
    margin: 0;
    padding: 0;
}
</style>
