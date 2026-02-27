import React, { useCallback } from 'react';
import { NotificationProps } from './Notification';
import { useStore } from '@/context/AppContext';

type NotificationData = Omit<NotificationProps, 'id' | 'onDismiss'>;
let notificationId = 0;

export const notificationService = {
  show: (_data: NotificationData) => { },
};

const NotificationContainer: React.FC = () => {
  const { dispatch } = useStore();

  const show = useCallback((data: NotificationData) => {
    const id = `notif-${notificationId++}`;
    const newNotification: NotificationProps = {
      ...data,
      id,
      onDismiss: () => { },
    };
    // Only add to history — no floating toast shown; access via notification bell
    dispatch({ type: 'ADD_NOTIFICATION_TO_HISTORY', payload: newNotification });
  }, [dispatch]);

  notificationService.show = show;

  // Render nothing — notifications live in the center panel only
  return null;
};

export default NotificationContainer;