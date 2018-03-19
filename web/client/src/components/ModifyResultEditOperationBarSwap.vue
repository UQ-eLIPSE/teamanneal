<template>
    <div class="swap-operation">
        <div class="operation-banner">
            <span>Swap People</span>
        </div>

        <div class="content">
            <button class="edit-operation-field"
                    :class="recordAClasses"
                    @click="onRecordAClick">{{ recordA }}</button> &lt;-&gt;
            <button class="edit-operation-field"
                    :class="recordBClasses"
                    @click="onRecordBClick">{{ recordB }}</button>
            <button @click="onSwapButtonClick">Swap</button>
        </div>
    </div>
</template>


<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

// TODO: Change this from `any` to the definition provided in ModifyResult.vue
type EditOperation_SwapRecords = any;

@Component
export default class ModifyResultEditOperationBarSwap extends Vue {
    @Prop pendingEditOperation = p<EditOperation_SwapRecords>({ required: true });

    get recordA() {
        if (this.pendingEditOperation.recordA === undefined) {
            return "<Person A>";
        }

        return this.pendingEditOperation.recordA.recordId;
    }

    get recordB() {
        if (this.pendingEditOperation.recordB === undefined) {
            return "<Person B>";
        }

        return this.pendingEditOperation.recordB.recordId;
    }

    get recordAClasses() {
        return {
            focus: this.pendingEditOperation.cursor === "recordA",
        };
    }

    get recordBClasses() {
        return {
            focus: this.pendingEditOperation.cursor === "recordB",
        };
    }

    onRecordAClick() {
        this.$emit("cursorChange", "recordA");
    }

    onRecordBClick() {
        this.$emit("cursorChange", "recordB");
    }

    onSwapButtonClick() {
        this.$emit("commitOperation");
    }
}
</script>

<style scoped>
.swap-operation {
    display: flex;
}

.operation-banner {
    height: 100%;
    background-color: #49075e;
    color: white;
    font-size: 1.7em;
    font-family: inherit;
    padding: 1.2rem 1rem 1.2rem 0.5rem;
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
