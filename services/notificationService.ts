import { Reminder } from '../types';

// In-memory store for scheduled notification timeouts. A Map is used to associate reminder IDs with their timeout identifiers.
const scheduledNotifications = new Map<string, number[]>();

const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
            // .ready waits for the service worker to become active.
            return await navigator.serviceWorker.ready;
        } catch (error) {
            console.error('[NotificationService] Service Worker not ready:', error);
            return null;
        }
    }
    return null;
};


export const requestNotificationPermission = async (): Promise<boolean> => {
    if ('Notification' in window) {
        // If permission has already been denied, do nothing.
        if (Notification.permission === 'denied') {
            return false;
        }

        // If permission is in the default state, then request it from the user.
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('[NotificationService] Notification permission was not granted by the user.');
                return false;
            }
        }
        
        // If permission is granted (either previously or just now), return true.
        return true;
    }

    console.warn('[NotificationService] This browser does not support desktop notification.');
    return false;
};

const showNotification = async (reminder: Reminder, body: string) => {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
        console.error("[NotificationService] No active Service Worker registration found to show notification.");
        return;
    }

    const options: any = {
        body,
        icon: '/favicon.svg',
        // tag is used to uniquely identify a notification. If a new notification has the same tag as an existing one, it replaces the old one.
        tag: reminder.id,
        // renotify is deprecated, but replacing a notification with the same tag usually involves user attention by default on many platforms.
        actions: [
            { action: 'snooze', title: 'Snooze (5 mins)' },
            { action: 'open', title: 'Open App' },
        ],
        // data allows arbitrary data to be passed with the notification, useful in the service worker.
        data: {
            reminderId: reminder.id
        }
    };

    await registration.showNotification(reminder.title, options);
};


export const scheduleNotificationsForReminder = (reminder: Reminder) => {
    // Do not schedule notifications if permission isn't granted, the date is invalid, or the reminder is already completed.
    if (Notification.permission !== 'granted' || !reminder.date || reminder.is_completed) {
        return;
    }

    // First, clear any existing scheduled notifications for this reminder to avoid duplicates on update.
    cancelNotificationsForReminder(reminder.id);

    const now = new Date().getTime();
    const dueDate = new Date(reminder.date).getTime();
    const newTimeoutIds: number[] = [];

    // Define the time points before the due date to send notifications.
    const schedulePoints = [
        { time: dueDate - 7 * 24 * 60 * 60 * 1000, label: 'in 7 days' },
        { time: dueDate - 3 * 24 * 60 * 60 * 1000, label: 'in 3 days' },
        { time: dueDate - 1 * 24 * 60 * 60 * 1000, label: 'tomorrow' },
        { time: dueDate - 30 * 60 * 1000, label: 'in 30 minutes' },
    ];
    
    schedulePoints.forEach(point => {
        const delay = point.time - now;
        // Only schedule notifications that are in the future.
        if (delay > 0) {
            const timeoutId = window.setTimeout(() => {
                const body = `This is due ${point.label}. ${reminder.description || ''}`.trim();
                showNotification(reminder, body);
            }, delay);
            newTimeoutIds.push(timeoutId);
        }
    });

    if (newTimeoutIds.length > 0) {
        scheduledNotifications.set(reminder.id, newTimeoutIds);
    }
};

export const cancelNotificationsForReminder = (reminderId: string) => {
    const timeoutIds = scheduledNotifications.get(reminderId);
    if (timeoutIds) {
        // Clear all scheduled timeouts for this reminder ID.
        timeoutIds.forEach(clearTimeout);
        scheduledNotifications.delete(reminderId);
    }
    
    // Also, close any currently visible notification for this reminder.
    getServiceWorkerRegistration().then(registration => {
        if (!registration) return;
        registration.getNotifications({ tag: reminderId }).then(notifications => {
            notifications.forEach(notification => notification.close());
        });
    });
};