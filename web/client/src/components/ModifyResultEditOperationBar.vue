<template>
    <div class="edit-operation-bar">
        <div v-if="!isEditOperationActive"
             class="operation-button-list">
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation('move-record')">Move Person</button>
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation()">Swap people</button>
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation()">Add Person</button>
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation()">Remove Person</button>
        </div>
        <div v-if="isEditOperationActive"
             class="edit-operation-component">
            <div class="close-button"
                 @click="cancelOperation">&times;</div>
            <component :is="editOperationComponent"
                       :pendingEditOperation="pendingEditOperation"
                       @cursorChange="onCursorChange"
                       @commitOperation="onCommitOperation"></component>
        </div>
    </div>
</template>


<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import ModifyResultEditOperationBarMove from "./ModifyResultEditOperationBarMove.vue";
import ModifyResultEditOperationBarSwap from "./ModifyResultEditOperationBarSwap.vue";
import ModifyResultEditOperationBarAdd from "./ModifyResultEditOperationBarAdd.vue";
import ModifyResultEditOperationBarRemove from "./ModifyResultEditOperationBarRemove.vue";

// TODO: Change this from `any` to the definition provided in ModifyResult.vue
type EditOperation = any;

/** 
 * Maps operation to respective component
 */
const EDIT_OPERATION_COMPONENT_MAP: { [key: string]: any } = {
    "move-record": ModifyResultEditOperationBarMove,
    "swap-records": ModifyResultEditOperationBarSwap,
    "add-record": ModifyResultEditOperationBarAdd,
    "remove-record": ModifyResultEditOperationBarRemove,
}

@Component({
    components: {
        ModifyResultEditOperationBarMove,
        ModifyResultEditOperationBarSwap,
        ModifyResultEditOperationBarAdd,
        ModifyResultEditOperationBarRemove
    }
})
export default class ModifyResultEditOperationBar extends Vue {
    @Prop pendingEditOperation = p<EditOperation | undefined>({ required: true });

    get editOperationComponent() {
        return EDIT_OPERATION_COMPONENT_MAP[this.pendingEditOperation.type] || undefined;
    }

    get isEditOperationActive() {
        return this.pendingEditOperation !== undefined;
    }

    selectOperation(operationType: string) {
        this.$emit("selectOperation", operationType);
    }

    cancelOperation() {
        this.$emit("cancelOperation");
    }

    onCursorChange(value: string | undefined) {
        this.$emit("cursorChange", value);
    }

    onCommitOperation() {
        this.$emit("commitOperation");
    }
}
</script>
<style scoped src="../static/stylesheet.css"></style>
<style scoped>
.operation-button-list {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
}

.operation-button-list>.button {
    margin-left: 0.5rem;
}

.edit-operation-component {
    display: flex;
    align-items: center;
}

.close-button {
    font-size: 2em;
    background-color: #49075e;
    border: 0;
    height: 100%;
    color: #fff;
    cursor: pointer;
    padding: 1rem 0.5rem;
}

.close-button:hover,
.close-button:focus,
.close-button:active {
    color: rgba(200, 0, 0, 0.8);
}
</style>
