import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, [permission]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (permission !== 'granted') return;

    // Try ServiceWorker-based notification first (works when page is backgrounded on mobile)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      }).catch(() => {
        // Fallback to main-thread notification
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  }, [permission]);

  return { permission, sendNotification };
}
