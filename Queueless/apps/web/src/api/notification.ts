import api from './client';

export interface WebNotification {
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  branchId?: string | null;
  type: string;
  title: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'IMPORTANT' | 'URGENT';
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export const notificationApi = {
  getNotifications: async (params?: {
    scope?: string;
    branchId?: string;
    limit?: number;
    offset?: number;
    isRead?: boolean;
  }): Promise<{ notifications: WebNotification[]; total: number }> => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async (params?: { scope?: string; branchId?: string }): Promise<number> => {
    const res = await api.get('/notifications/unread-count', { params });
    return res.data.count;
  },

  markAsRead: async (id: string): Promise<WebNotification> => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (params?: { scope?: string; branchId?: string }): Promise<{ success: boolean }> => {
    const res = await api.post('/notifications/read-all', {}, { params });
    return res.data;
  },
};

export default notificationApi;
