import apiClient from './client';

export interface MobileNotification {
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  branchId?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  priority?: 'URGENT' | 'ACTION_REQUIRED' | 'IMPORTANT' | 'NORMAL' | 'LOW' | 'INFO' | string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export const notificationApi = {
  getNotifications: async (params?: { limit?: number; offset?: number; isRead?: boolean }) => {
    const res = await apiClient.get<{ notifications: MobileNotification[]; total: number }>(
      '/notifications',
      { params }
    );
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch<MobileNotification>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    try {
      const res = await apiClient.patch<{ success: boolean }>('/notifications/read-all');
      return res.data;
    } catch {
      const res = await apiClient.post<{ success: boolean }>('/notifications/read-all');
      return res.data;
    }
  },

  registerDevice: async (deviceToken: string, platform: string = 'EXPO') => {
    const res = await apiClient.post('/notifications/devices', { deviceToken, platform });
    return res.data;
  },

  removeDevice: async (deviceToken: string) => {
    const res = await apiClient.delete(`/notifications/devices/${deviceToken}`);
    return res.data;
  },
};

export default notificationApi;
