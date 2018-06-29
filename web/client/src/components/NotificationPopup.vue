<template>
    <div class="notification-card"
         :class="notificationClasses">
        <button type="button"
                class="close-button"
                @click.prevent="close">&times;</button>
        <h3>{{title}}</h3>
        <p>{{message}}</p>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">

import { Vue, Component, Prop, p } from "av-ts";
import { NotificationOptions } from "../data/Notification";

@Component
export default class NotificationPopup extends Vue {
    @Prop title = p({ type: String, required: true })
    @Prop message = p({ type: String, required: true });
    @Prop mode: NotificationOptions["mode"] = p({ type: String, required: true });
    @Prop id = p({ type: String, required: true });

    close() {
        this.$emit("closeNotification", this.id);
    }

    get notificationClasses() {
        return {
            "success": this.mode === "success",
            "error": this.mode === "error",
            "warning": this.mode === "warning",
        }
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.notification-card {
    position: relative;
    width: 100%;
    min-height: 6rem;
    padding: .75rem 1.25rem;
    margin-bottom: 0.5rem;
    border: 1px solid transparent;
    border-radius: .25rem;
    padding: 0.5rem;
}

.success {
    background: rgba(223, 240, 216, 0.95);
    border-color: #d0e9c6;
    color: #3c763d;
}

.error {
    background: rgba(242, 222, 222, 0.95);
    border-color: #ebcccc;
    color: #a94442;
}

.warning {
    background-color: #fcf8e3;
    border-color: #faf2cc;
    color: #8a6d3b;
}

.close-button {
    position: absolute;
    top: 5%;
    right: 2%;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 1.5em;
}

.close-button:hover,
.close-button:focus,
.close-button:active {
    color: #c71585;
}

.notification-card>h3,
.notification-card>p {
    padding: 0.25rem;
    margin: 0.25rem;
}
</style>
