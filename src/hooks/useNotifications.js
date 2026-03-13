import { useState, useCallback, useEffect } from 'react';

export default function useNotifications() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn("This browser does not support desktop notification");
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission();
      setPermission(p);
      return p === 'granted';
    }
    
    return false;
  }, []);

  const sendNotification = useCallback((title, options = {}) => {
    if (permission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        icon: '/f1-favicon.png', // Fallback icon path
        badge: '/f1-favicon.png',
        ...options
      });
    }
  }, [permission]);

  // Specific F1 event pushers
  const notifyRain = useCallback(() => {
    sendNotification('🌧️ Rain Expected', { body: 'Rain has been detected at the circuit.' });
  }, [sendNotification]);

  const notifySafetyCar = useCallback((type) => {
    sendNotification('⚠️ Safety Car Deployed', { body: `A ${type} has been deployed by Race Control.` });
  }, [sendNotification]);

  const notifySessionStart = useCallback((sessionName) => {
    sendNotification('🏁 Session Starting Soon', { body: `${sessionName} will begin in 15 minutes.` });
  }, [sendNotification]);

  return {
    permission,
    requestPermission,
    sendNotification,
    notifyRain,
    notifySafetyCar,
    notifySessionStart
  };
}
