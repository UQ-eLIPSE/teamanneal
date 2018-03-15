<template>
    <div class="edit-operation-bar">
        <div class="operation-button-list"
             v-show="!isOperationSelected">
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation(operationMap.MOVE)">Move Person</button>
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation(operationMap.SWAP)">Swap people</button>
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation(operationMap.ADD)">Add Person</button>
            <button type="button"
                    class="button"
                    @click.prevent="selectOperation(operationMap.REMOVE)">Remove Person</button>
        </div>
        <div class="edit-operation-component">
            <div v-if="isOperationSelected"
                 class="close-button"
                 @click="handleOperationClose">&times;</div>

            <component v-if="isOperationSelected"
                       :is="operation.component"></component>
        </div>


    </div>
</template>


<script lang="ts">
import { Vue, Component } from "av-ts";
import ModifyResultEditOperationBarMove from "./ModifyResultEditOperationBarMove.vue";
import ModifyResultEditOperationBarSwap from "./ModifyResultEditOperationBarSwap.vue";
import ModifyResultEditOperationBarAdd from "./ModifyResultEditOperationBarAdd.vue";
import ModifyResultEditOperationBarRemove from "./ModifyResultEditOperationBarRemove.vue";

interface Operation {
    component: any
}

/** 
 * Maps operation to respective component
 */
const OPERATION_MAP: { [key: string]: Operation } = {
    MOVE: {
        component: ModifyResultEditOperationBarMove
    },
    SWAP: {
        component: ModifyResultEditOperationBarSwap
    },
    ADD: {       
        component: ModifyResultEditOperationBarAdd
    },
    REMOVE: { 
        component: ModifyResultEditOperationBarRemove
    },
    // `NO_OPERATION` explicitly depicts a state when no operation is selected to avoid any ambiguity
    NO_OPERATION: {
        component: undefined
    },
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
    /** Stores currently selected operation, selects NO_OPERATION by default */
    private currentOperation: Operation = OPERATION_MAP.NO_OPERATION;

    get operationMap() {
        return OPERATION_MAP;
    }

    get operation() {
        return this.currentOperation;
    }

    set operation(operation: Operation) {
        this.currentOperation = operation;
    }

    get isOperationSelected() {
        return this.operation !== this.operationMap.NO_OPERATION;
    }

    selectOperation(operation: Operation) {
        this.operation = operation;
    }

    /** Resets the current operation to `NO_OPERATION` */
    handleOperationClose() {
        this.operation = this.operationMap.NO_OPERATION;
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