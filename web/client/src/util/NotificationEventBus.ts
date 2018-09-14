import Vue from "vue";
import * as Notification from "../data/Notification";

/** Event  bus for handling notification events */
export const notificationEventBus = new Vue();

/** Create a notification using the event bus */
export const notifySystem = (payload: Notification.NotificationPayload) => {
    notificationEventBus.$emit("notify", payload);
}

/**
 * Listens for the `notify` event emitted by the `notifySystem` method.
 */
export const onSystemNotified = (handler: (_p: Notification.NotificationPayload) => void) => {
    notificationEventBus.$on("notify", handler);
}


/*
    To create a notification, import `notifySystem` into the component
    Then, create a new notification as follows:-

    notifySystem({
        title: <Title of the notification>,
        message: <Additional text>,
        options: {
            duration: <number in milliseconds>,
            mode: <"success" | "error" | "warning">
        }
    })
 */