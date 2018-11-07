<template>
    <div class="jump-to-filter">
        <select v-model="selectedId">
            <option :value="defaultId">Jump To...</option>
            <option v-for="(n, i) in selectionGroup"
                    :key="i"
                    :value="n.nodeId">{{n.label}}</option>
        </select>
    </div>
</template>
<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Watch } from "av-ts";
import { GroupNodeRoot } from "../data/GroupNodeRoot";
import { GroupNodeIntermediateStratum } from "../data/GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "../data/GroupNodeLeafStratum";

import { ResultsEditor as S } from "../store";

interface NodeLabel {
    nodeId: string,
    label: string,
}

const DEFAULT_ID = "";

@Component
export default class SpreadsheetJumpToFilter extends Vue {

    // Empty should reference a null/noid
    selectedId: string = DEFAULT_ID;

    // The reason we can't use the structure directly as it orders higher level components last
    // so the ordering cannot be determined
    get selectionGroup() {
        const strataStructure = S.state.groupNode.structure.roots;
        const output: NodeLabel[] = [];

        // Skip the root node level if only one node root exists
        if (!this.isDataPartitioned) {
            // If data is not partitioned, skip over the root node level
            for (let i = 0; i < strataStructure[0].children.length; i++) {
                this.loopLevel(strataStructure[0].children[i], output, 0);
            }

        } else {
            for (let i = 0; i < strataStructure.length; i++) {
                this.loopLevel(strataStructure[i], output, 0);
            }
        }

        return output;
    }

    get defaultId() {
        return DEFAULT_ID;
    }
    get nodeRoots() {
        return S.state.groupNode.structure.roots;
    }
    get isDataPartitioned() {
        return S.get(S.getter.IS_DATA_PARTITIONED);
    }

    // Recurses through the structure and slowly adds them in the list
    loopLevel(incomingNode: GroupNodeRoot | GroupNodeIntermediateStratum | GroupNodeLeafStratum, output: NodeLabel[], depth: number) {
        const testLabel: NodeLabel = {
            nodeId: incomingNode._id,
            label: "----".repeat(depth) + S.state.groupNode.nameMap[incomingNode._id]
        }

        // Push test label
        // Checks for whether the data is partitioned or not
        // are done while calling the `loopLevel` function
        output.push(testLabel);


        if ((incomingNode.type === "root") || (incomingNode.type === "intermediate-stratum")) {
            // Treat as root level
            for (let i = 0; i < incomingNode.children.length; i++) {
                this.loopLevel(incomingNode.children[i], output, depth + 1);
            }
        }

        return output;
    }

    @Watch("selectedId")
    jumpAndScroll(value: string, _oldValue: string) {
        if (value !== this.defaultId) {
            // The idea If targetdepth <= depth, add it to the list associated with the path
            let path: string[] = [];
            for (let i = 0; i < this.nodeRoots.length; i++) {
                let maybePath = this.recursePath(value, this.nodeRoots[i], []);

                // Stop searching at the top level
                if (maybePath !== null) {
                    path = maybePath;
                    break;
                }
            }
            // Now collapse
            S.dispatch(S.action.UNCOLLAPSE_NODES, path);

            // Now scroll. Since the startum are manually created. We can safely use the id
            this.$nextTick(() => {
                const elmnt = document.getElementById(value);
                if (elmnt !== null) {
                    elmnt.scrollIntoView();
                }
            });

            // Reset ID to default ID
            this.selectedId = DEFAULT_ID;
        }

    }


    // This is for jump to paths
    recursePath(targetName: string, incomingNode: GroupNodeRoot | GroupNodeIntermediateStratum | GroupNodeLeafStratum, output: string[]) {
        // If we somehow equal the path. stop
        if (targetName === incomingNode._id) {
            // Go back as we found the source
            output.push(incomingNode._id);
            return output;
        }

        // Keep going. If we receive a non-empty array
        if ((incomingNode.type === "root") || (incomingNode.type === "intermediate-stratum")) {
            for (let i = 0; i < incomingNode.children.length; i++) {
                const possiblePath = this.recursePath(targetName, incomingNode.children[i], output);
                if (possiblePath !== null) {
                    // We have something, stop searching and return
                    output.push(incomingNode._id);
                    return output;
                }
            }
        }

        // Return a null to show failure to find the id in that path
        return null;
    }


}
</script>

<!-- ####################################################################### -->

<style scoped>
.jump-to-filter {
    padding: 0.5rem;
    background: rgb(240, 240, 240);
    align-items: center;
    display: flex;
}

select {
    padding: 0.25rem;
    font-size: 1.25rem;
}
</style>
