import api from './client';

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  message: string;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface Conversation {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  staffId?: string | null;
  queueEntryId?: string | null;
  appointmentId?: string | null;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  staff?: {
    id: string;
    fullName: string;
    email: string;
  };
  queueEntry?: {
    id: string;
    ticketNumber: string;
    status: string;
    position: number;
  };
  appointment?: {
    id: string;
    status: string;
    scheduledTime: string;
  };
  messages?: ConversationMessage[];
}

export const messageApi = {
  getOrCreateConversation: async (params: {
    queueEntryId?: string;
    appointmentId?: string;
  }): Promise<Conversation> => {
    const res = await api.post('/messages/conversations', params);
    return res.data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const res = await api.get(`/messages/conversations/${id}`);
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    message: string,
    metadata?: any
  ): Promise<ConversationMessage> => {
    const res = await api.post(`/messages/conversations/${conversationId}/messages`, {
      message,
      metadata,
    });
    return res.data;
  },

  markAsRead: async (conversationId: string): Promise<{ count: number }> => {
    const res = await api.patch(`/messages/conversations/${conversationId}/read`);
    return res.data;
  },

  getBranchConversations: async (branchId: string): Promise<Conversation[]> => {
    const res = await api.get(`/messages/branch/${branchId}`);
    return res.data;
  },
};

export default messageApi;
