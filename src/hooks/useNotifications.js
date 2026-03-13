import { useState, useCallback } from 'react';

export const useNotifications = () => {
    const [permission, setPermission] = useState(Notification.permission);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.warn("This browser does not support desktop notification");
            return;
        }
        if (Notification.permission !== 'denied') {
            const perm = await Notification.requestPermission();
            setPermission(perm);
        }
    };

    const sendNotification = useCallback((title, options = {}) => {
        if (permission === 'granted') {
            new Notification(title, {
                icon: '/vite.svg', // generic icon fallback
                ...options
            });
        }
    }, [permission]);

    const scheduleNotification = useCallback((title, dateString) => {
        const targetTime = new Date(dateString).getTime();
        const now = new Date().getTime();
        const timeUntilStart = targetTime - now;

        // Schedule 15 mins before
        const notificationTime = timeUntilStart - (15 * 60 * 1000);

        if (notificationTime > 0) {
            setTimeout(() => {
                sendNotification(`F1 Reminder: ${title} starts in 15 minutes!`, {
                    body: 'Get ready for the session.'
                });
            }, notificationTime);
            alert(`Reminder set for ${title} (15 mins before start).`);
        } else {
            alert('This session has already started or is too close to start.');
        }
    }, [sendNotification]);

    return {
        permission,
        requestPermission,
        sendNotification,
        scheduleNotification
    };
};
