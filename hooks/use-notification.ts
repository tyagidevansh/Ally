import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, [permission]);

  const sendNotification = (title: string, options: any) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  };

  return { permission, sendNotification };
}
