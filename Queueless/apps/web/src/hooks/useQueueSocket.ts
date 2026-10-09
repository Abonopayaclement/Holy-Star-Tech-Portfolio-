import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../utils/config';

let socket: Socket;

export const useQueueSocket = (queueId: string | undefined, onUpdate: () => void) => {
  useEffect(() => {
    if (!queueId) return;

    if (!socket) {
      socket = io(CONFIG.SOCKET_URL);
    }

    socket.emit('join_queue_room', queueId);

    socket.on('queue_updated', () => {
      onUpdate();
    });

    return () => {
      socket.off('queue_updated');
    };
  }, [queueId, onUpdate]);

  return socket;
};
