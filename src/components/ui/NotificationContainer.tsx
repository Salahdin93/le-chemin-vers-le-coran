import React, { useState, useCallback } from 'react';
import Notification, { NotificationProps } from './Notification';
import { useStore } from '@/context/AppContext';

type NotificationData = Omit<NotificationProps, 'id' | 'onDismiss'>;
let notificationId = 0;

export const notificationService = {
  show: (_data: NotificationData) => { },
};

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const { dispatch } = useStore();

  const show = useCallback((data: NotificationData) => {
    const id = `notif-${notificationId++}`;
    const newNotification: NotificationProps = {
      ...data,
      id,
      onDismiss: (idToRemove: string) => {
        setNotifications(current => current.filter(n => n.id !== idToRemove));
      }
    };

    setNotifications(current => [newNotification, ...current]);
    dispatch({ type: 'ADD_NOTIFICATION_TO_HISTORY', payload: newNotification });
  }, [dispatch]);

  notificationService.show = show;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3">
      {notifications.map(notification => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );
};

export default NotificationContainer;