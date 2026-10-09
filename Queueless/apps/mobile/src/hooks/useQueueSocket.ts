import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

export const useQueueSocket = (
  queueId: string | undefined | null,
  onQueueUpdate: (eventData?: any) => void
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!queueId) return;

    // Derive server origin from API URL (strip /api)
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
        socket.emit('join_queue_room', queueId);
      });

      socket.on('queue_updated', (data) => {
        onQueueUpdate(data);
      });

      // Polling fallback every 8 seconds in case socket drops in mobile background
      const interval = setInterval(() => {
        onQueueUpdate({ type: 'HEARTBEAT_POLL' });
      }, 8000);

      return () => {
        clearInterval(interval);
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (err) {
      console.warn('Socket.io connection failed, falling back to polling', err);
      const interval = setInterval(() => {
        onQueueUpdate({ type: 'FALLBACK_POLL' });
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [queueId]);

  return socketRef.current;
};

export default useQueueSocket;
