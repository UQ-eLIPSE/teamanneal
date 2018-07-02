<template>
    <div class="notifications">

        <NotificationPopup v-for="(n,i) in notifications"
                           :title="n.title"
                           :message="n.message"
                           :id="n._id"
                           :mode="n.options.mode"
                           @closeNotification="closeNotification"
                           :key="n._id"></NotificationPopup>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle } from "av-ts";
import NotificationPopup from "./NotificationPopup.vue";
import { onSystemNotified } from "../util/NotificationEventBus";
import { NotificationPayload } from "../data/Notification";
import * as UUID from "../util/UUID";

@Component({
    components: {
        NotificationPopup
    }
})
export default class Notifications extends Vue {

    private notifications: NotificationPayload[] = [];

    /** Maps from `notification id` to `timeoutID` (returned from `setTimeout()`) */
    private notificationTimeoutMap: Map<string, number> = new Map();

    closeNotification(notificationId: string) {
        // De-register the timeout handle from the map
        this.deregisterNotificationTimeout(notificationId);

        // Remove the notification from the list of notifications
        this.notifications.splice(this.notifications.findIndex((n) => n._id === notificationId), 1);
    }

    /** Deletes the timeout handle from `notificationTimeoutMap` and clears the timeout associated with `timeoutID` */
    deregisterNotificationTimeout(notificationId: string) {
        const timeoutId = this.notificationTimeoutMap.get(notificationId);

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            this.notificationTimeoutMap.delete(notificationId);
        }
    }

    registerNotificationTimeout(notificationId: string, timeoutDuration: number) {
        this.notificationTimeoutMap.set(notificationId, setTimeout(() => this.closeNotification(notificationId), timeoutDuration));
    }

    /** Ensures that notification ids are unique (checks for collisions) and generates an id */
    generateNotificationId(): string {
        const id = UUID.generate();
        if (this.notificationTimeoutMap.has(id)) {
            return this.generateNotificationId();
        }

        return id;
    }

    @Lifecycle mounted() {

        // Set up an event listener for listening to notifications
        onSystemNotified((payload: NotificationPayload) => {

            // Assign an `id` to the notification
            payload._id = this.generateNotificationId();

            this.notifications.push(payload);

            if (payload.options && payload.options.duration !== undefined) {
                this.registerNotificationTimeout(payload._id, payload.options.duration);
            }
        });

    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.notifications {
    display: block;
    width: 30%;
    min-width: 15em;
    max-width: 25em;
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: 99999999;
    margin: 1rem;
}
</style>
