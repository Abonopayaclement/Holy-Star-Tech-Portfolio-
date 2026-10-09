import { apiClient } from './client';
import { CallbackRequest, CallbackThreshold } from '../types';

export const callbackApi = {
  createOrUpdateCallback: async (params: {
    queueEntryId: string;
    threshold: CallbackThreshold;
    channel?: string;
  }): Promise<CallbackRequest> => {
    const res = await apiClient.post('/callbacks', params);
    return res.data;
  },

  getActiveCallback: async (entryId: string): Promise<CallbackRequest | null> => {
    const res = await apiClient.get(`/callbacks/active/${entryId}`);
    return res.data;
  },

  acknowledgeCallback: async (id: string): Promise<CallbackRequest> => {
    const res = await apiClient.post(`/callbacks/${id}/acknowledge`);
    return res.data;
  },

  cancelCallback: async (id: string, reason?: string): Promise<CallbackRequest> => {
    const res = await apiClient.post(`/callbacks/${id}/cancel`, { reason });
    return res.data;
  },
};

export default callbackApi;
