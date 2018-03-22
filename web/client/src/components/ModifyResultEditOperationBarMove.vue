<template>
    <div class="move-operation">
        <div class="operation-banner">
            <span>Move Person</span>
        </div>

        <div class="content">
            <button class="edit-operation-field"
                    :class="fromNodeClasses"
                    @click="onFromNodeClick">{{ fromNode }}</button> -&gt;
            <button class="edit-operation-field"
                    :class="toNodeClasses"
                    @click="onToNodeClick">{{ toNode }}</button>
            <button @click="onMoveButtonClick">Move</button>
        </div>
    </div>
</template>


<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

// TODO: Change this from `any` to the definition provided in ModifyResult.vue
type EditOperation_MoveRecord = any;

@Component
export default class ModifyResultEditOperationBarMove extends Vue {
    @Prop pendingEditOperation = p<EditOperation_MoveRecord>({ required: true });

    get fromNode() {
        if (this.pendingEditOperation.from === undefined) {
            return "<Person>";
        }

        return this.pendingEditOperation.from.recordId;
    }

    get toNode() {
        if (this.pendingEditOperation.to === undefined) {
            return "<To>";
        }

        const path = this.pendingEditOperation.to.path;

        return path[path.length - 1]._id;
    }

    get fromNodeClasses() {
        return {
            focus: this.pendingEditOperation.cursor === "from",
        };
    }

    get toNodeClasses() {
        return {
            focus: this.pendingEditOperation.cursor === "to",
        };
    }

    onFromNodeClick() {
        this.$emit("cursorChange", "from");
    }

    onToNodeClick() {
        this.$emit("cursorChange", "to");
    }

    onMoveButtonClick() {
        this.$emit("commitOperation");
    }
}
</script>

<style scoped>
.move-operation {
    display: flex;
}

.operation-banner {
    height: 100%;
    background-color: #49075e;
    color: white;
    font-size: 1.7em;
    font-family: inherit;
    padding: 1.2rem 1rem 1.2rem 0.5rem;

    flex-grow: 0;
    flex-shrink: 0;

    width: 10em;
}

.operation-form {
    flex-grow: 1;
}

.edit-operation-field {
    display: inline-block;
    background: #fff;
    color: inherit;
    border: 0.1em solid;
    border-radius: 0;
}

.edit-operation-field.focus {
    color: #fff;
    background: #747;
    border-color: #49075e;
}
</style>
