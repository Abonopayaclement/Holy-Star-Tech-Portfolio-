import { useEffect, useState, useCallback, useRef } from 'react';
import { Vibration } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import { useAuth } from './useAuth';
import notificationApi, { MobileNotification } from '../api/notificationApi';
import { triggerQueueAlert } from '../services/alertService';

export const useCustomerNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.warn('Failed to fetch unread notification count:', e);
    }
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({ limit: 50 });
      setNotifications(res.notifications);
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.warn('Failed to fetch notifications list:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!user?.id) return;

    const serverUrl = API_BASE_URL.replace(/\/api\/?$/, '');

    try {
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_user_room', user.id);
      });

      socket.on('new_notification', (data: MobileNotification) => {
        // Increment unread count
        setUnreadCount((prev) => prev + 1);

        // Prepend to notifications list
        setNotifications((prev) => [data, ...prev.filter((n) => n.id !== data.id)]);

        // Trigger Ring, Vibration, and TalkBack based on user alert settings
        if (data.type === 'QUEUE_CALLED') {
          triggerQueueAlert({
            type: 'NEAR',
            customMessage: 'Your turn is up. Please proceed to the service desk.',
          });
        } else if (data.type === 'QUEUE_SERVING') {
          triggerQueueAlert({
            type: 'SERVING',
            customMessage: 'You are now being served.',
          });
        } else if (data.type === 'QUEUE_MILESTONE_2') {
          triggerQueueAlert({
            type: 'NEAR',
            customMessage: 'Your queue is near. Only two people ahead of you.',
          });
        } else if (data.type === 'QUEUE_MILESTONE_5') {
          triggerQueueAlert({
            type: 'GENERIC',
            customMessage: 'Your queue is advancing. About five people ahead of you.',
          });
        } else if (data.type === 'APPOINTMENT_APPROVED') {
          triggerQueueAlert({
            type: 'GENERIC',
            customMessage: 'Your appointment has been approved. Please review details and complete payment.',
          });
        } else {
          triggerQueueAlert({
            type: 'GENERIC',
            customMessage: data.title || 'New notification received.',
          });
        }
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (err) {
      console.warn('Socket connection error in useCustomerNotifications:', err);
    }
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.warn('Failed to mark notification as read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Failed to mark all notifications as read:', e);
    }
  };

  return {
    unreadCount,
    notifications,
    loading,
    refreshNotifications: fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};

export default useCustomerNotifications;
