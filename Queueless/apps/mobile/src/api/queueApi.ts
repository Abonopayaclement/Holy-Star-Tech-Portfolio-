import apiClient from './client';
import { CustomerTicketStatus, QueueEntry, PriorityLevel, NotificationPreference } from '../types';

export const queueApi = {
  joinQueue: async (
    queueId: string,
    options?: {
      isRemote?: boolean;
      notes?: string;
      qrToken?: string;
      priority?: PriorityLevel;
      notificationPreference?: NotificationPreference;
    }
  ): Promise<QueueEntry> => {
    const res = await apiClient.post<QueueEntry>('/queues/join', {
      queueId,
      isRemote: options?.isRemote,
      notes: options?.notes,
      qrToken: options?.qrToken,
      priority: options?.priority,
      notificationPreference: options?.notificationPreference,
    });
    return res.data;
  },

  getMyActiveTicket: async (): Promise<CustomerTicketStatus | null> => {
    const res = await apiClient.get<CustomerTicketStatus | null>('/queues/my-active');
    return res.data;
  },

  getTicketStatus: async (entryId: string): Promise<CustomerTicketStatus> => {
    const res = await apiClient.get<CustomerTicketStatus>(`/queues/ticket/${entryId}`);
    return res.data;
  },

  getMyQueueHistory: async (): Promise<QueueEntry[]> => {
    const res = await apiClient.get<QueueEntry[]>('/queues/my-history');
    return res.data;
  },

  cancelTicket: async (entryId: string, reason?: string): Promise<QueueEntry> => {
    const res = await apiClient.post<QueueEntry>(`/queues/entry/${entryId}/cancel`, {
      reason: reason || 'Voluntarily cancelled by customer',
    });
    return res.data;
  },

  hideTicket: async (entryId: string): Promise<void> => {
    await apiClient.patch(`/queues/entry/${entryId}/hide`);
  },

  updatePreference: async (
    entryId: string,
    preference: NotificationPreference
  ): Promise<{ success: boolean; preference: NotificationPreference }> => {
    const res = await apiClient.patch<{ success: boolean; preference: NotificationPreference }>(
      `/queues/entry/${entryId}/preference`,
      { preference }
    );
    return res.data;
  },
};

export default queueApi;

