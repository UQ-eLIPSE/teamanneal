<template>
    <div class="notifications">
        <NotificationPopup v-for="(n,i) in notifications"
                           :notification="n"
                           @closeNotification="closeNotification"
                           :key="n._id"></NotificationPopup>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle } from "av-ts";
import NotificationPopup from "./NotificationPopup.vue";
import { onSystemNotified } from "../util/NotificationEventBus";
import * as Notification from "../data/Notification";
import * as UUID from "../util/UUID";

@Component({
    components: {
        NotificationPopup
    }
})
export default class Notifications extends Vue {
    private notifications: Notification.NotificationPayload[] = [];
    /** A map which keeps track of timer references */
    private notificationTimeoutMap: WeakMap<Notification.NotificationPayload, number> = new WeakMap();

    closeNotification(notification: Notification.NotificationPayload) {
        // De-register the timer reference from the map
        this.deregisterNotificationTimeout(notification);

        // Remove the notification itself
        this.notifications.splice(this.notifications.findIndex((n) => n._id === notification._id), 1);
    }

    deregisterNotificationTimeout(notification: Notification.NotificationPayload) {
        const timeoutHandle = this.notificationTimeoutMap.get(notification);

        if (timeoutHandle !== undefined) {
            // If timeout still exists, clear it and remove reference from the weak map
            clearTimeout(timeoutHandle);
            this.notificationTimeoutMap.delete(notification);
        }
    }

    registerNotificationTimeout(notification: Notification.NotificationPayload, timeout: number) {
        this.notificationTimeoutMap.set(notification, setTimeout(() => this.closeNotification(notification), timeout));
    }

    @Lifecycle mounted() {
        // Set up an event listener for listening to notifications
        onSystemNotified((payload: Notification.NotificationPayload) => {
            payload._id = UUID.generate();
            this.notifications.push(payload);

            if (payload.options && payload.options.duration !== undefined) {
                this.registerNotificationTimeout(payload, payload.options.duration);
            }
        });


    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.notifications {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    width: 20%;
    max-height: 90%;
    overflow: hidden;
    align-items: center;
    position: absolute;
    right: 0;
    bottom: 5%;
    z-index: 99999999;
    margin: 1rem;
}
</style>