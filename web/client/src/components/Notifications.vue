<template>
    <div class="notifications">
        <NotificationPopup v-for="(n,i) in notifications"
                           :notification="n"
                           @closeNotification="closeNotification"
                           :key="i"></NotificationPopup>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle } from "av-ts";
import NotificationPopup from "./NotificationPopup.vue";
import { notificationEventBus } from "../util/notification-event-bus";
import * as Notification from "../data/Notification";

@Component({
    components: {
        NotificationPopup
    }
})
export default class Notifications extends Vue {
    private notifications: Notification.NotificationPayload[] = [];


    closeNotification(notification: Notification.NotificationPayload) {
        this.notifications.splice(this.notifications.indexOf(notification), 1);
    }

    @Lifecycle mounted() {
        // Listen for the `notify` event
        notificationEventBus.$on("notify", (payload: Notification.NotificationPayload) => {
            this.notifications.push(payload);

            // Tried to define this setTimeout in the `NotificationPopup` component itself, 
            // but some peculiar issues were encountered. Some messages were not disappearing after the specified duration 
            // when notifications were rapidly added to the queue
            if (payload.options.hasOwnProperty("duration")) {
                setTimeout(() => {
                    this.closeNotification(payload);
                }, payload.options.duration);
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