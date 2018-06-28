/**
 * Interfaces for global notifications.
 * Note: Must specify `duration` for automatically hiding notifications (otherwise notifications will be persistent)
 * 
 */
export interface NotificationPayload {
    title: string;
    message: string;
    options: NotificationOptions;
    _id?: string;
}

export interface NotificationOptions {
    // Specify `duration` (in ms) to hide notifications automatically
    duration: number;

    // Used to style the notifications
    mode: "success" | "error" | "warning";
}