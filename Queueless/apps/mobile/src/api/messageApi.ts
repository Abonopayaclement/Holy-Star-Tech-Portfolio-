import { apiClient } from './client';
import { Conversation, Message } from '../types';

export const messageApi = {
  getOrCreateConversation: async (params: {
    queueEntryId?: string;
    appointmentId?: string;
  }): Promise<Conversation> => {
    const res = await apiClient.post('/messages/conversations', params);
    return res.data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const res = await apiClient.get(`/messages/conversations/${id}`);
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    message: string,
    metadata?: any
  ): Promise<Message> => {
    const res = await apiClient.post(`/messages/conversations/${conversationId}/messages`, {
      message,
      metadata,
    });
    return res.data;
  },

  markAsRead: async (conversationId: string): Promise<{ count: number }> => {
    const res = await apiClient.patch(`/messages/conversations/${conversationId}/read`);
    return res.data;
  },
};

export default messageApi;
