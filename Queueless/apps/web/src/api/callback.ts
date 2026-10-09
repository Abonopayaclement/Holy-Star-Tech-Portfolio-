import api from './client';

export interface CallbackRequest {
  id: string;
  organizationId: string;
  branchId: string;
  userId: string;
  queueEntryId: string;
  threshold: 'APPROACHING_5' | 'APPROACHING_2' | 'CALLED';
  channel: 'IN_APP_NOTIFICATION' | 'PUSH_NOTIFICATION' | 'SMS' | 'WHATSAPP' | 'PHONE_CALL';
  status: 'ACTIVE' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  triggeredAt?: string | null;
  acknowledgedAt?: string | null;
  cancelledAt?: string | null;
}

export const callbackApi = {
  createOrUpdateCallback: async (params: {
    queueEntryId: string;
    threshold: 'APPROACHING_5' | 'APPROACHING_2' | 'CALLED';
    channel?: string;
  }): Promise<CallbackRequest> => {
    const res = await api.post('/callbacks', params);
    return res.data;
  },

  getActiveCallback: async (entryId: string): Promise<CallbackRequest | null> => {
    const res = await api.get(`/callbacks/active/${entryId}`);
    return res.data;
  },

  acknowledgeCallback: async (id: string): Promise<CallbackRequest> => {
    const res = await api.post(`/callbacks/${id}/acknowledge`);
    return res.data;
  },

  cancelCallback: async (id: string, reason?: string): Promise<CallbackRequest> => {
    const res = await api.post(`/callbacks/${id}/cancel`, { reason });
    return res.data;
  },
};

export default callbackApi;
