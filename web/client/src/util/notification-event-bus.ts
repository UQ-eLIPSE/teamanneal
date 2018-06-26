import Vue from "vue";
/** Event  bus for handling notification events */
export const notificationEventBus = new Vue();

/*
    To create a notification, import `notificationEventBus` into the component
    Then, create a new notification as follows:-

    notificationEventBus.$emit("notify", {
        title: <Title of the notification>,
        message: <Additional text>,
        options: {
            duration: <number in milliseconds>,
            mode: <"success" | "error" | "warning">
        }
    })
 */