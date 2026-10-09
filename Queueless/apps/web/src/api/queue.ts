import api from './client';

export const joinQueue = async (queueId: string) => {
  const response = await api.post('/queues/join', { queueId });
  return response.data;
};

export const callNext = async (queueId: string, options?: { counterNumber?: string }) => {
  const response = await api.post(`/queues/${queueId}/next`, options || {});
  return response.data;
};

export const startServing = async (entryId: string, options?: { counterNumber?: string }) => {
  const response = await api.post(`/queues/entry/${entryId}/start`, options || {});
  return response.data;
};

export const submitRating = async (entryId: string, data: { rating: number; feedback?: string; tags?: string }) => {
  const response = await api.post(`/ratings/entry/${entryId}`, data);
  return response.data;
};

export const getBranchRatingSummary = async (branchId: string) => {
  const response = await api.get(`/ratings/branch/${branchId}/summary`);
  return response.data;
};

export const completeEntry = async (entryId: string) => {
  const response = await api.post(`/queues/entry/${entryId}/complete`);
  return response.data;
};

export const skipEntry = async (entryId: string) => {
  const response = await api.post(`/queues/entry/${entryId}/skip`);
  return response.data;
};

export const recallSkippedEntry = async (entryId: string, options?: { action?: 'CALL' | 'RETURN_TO_WAITING'; counterNumber?: string }) => {
  const response = await api.post(`/queues/entry/${entryId}/recall`, options || {});
  return response.data;
};

export const cancelEntry = async (entryId: string, data?: { reason?: string; reasonNote?: string }) => {
  const response = await api.post(`/queues/entry/${entryId}/cancel`, data || {});
  return response.data;
};

export const getQueueStatus = async (queueId: string) => {
  const response = await api.get(`/queues/${queueId}/status`);
  return response.data;
};

export const getCustomerTicket = async (entryId: string) => {
  const response = await api.get(`/queues/ticket/${entryId}`);
  return response.data;
};

export const getMyActiveTicket = async () => {
  const response = await api.get('/queues/my-active');
  return response.data;
};

export const getMyQueueHistory = async () => {
  const response = await api.get('/queues/my-history');
  return response.data;
};

export const updateQueueStatus = async (
  queueId: string,
  status: 'OPEN' | 'CLOSED',
  closedReason?: string | null
) => {
  const response = await api.patch(`/queues/${queueId}/status`, { status, closedReason });
  return response.data;
};

export const transferTicket = async (
  entryId: string,
  data: { destinationServiceId: string; reason: string; reasonNote?: string }
) => {
  const response = await api.post(`/queues/entry/${entryId}/transfer`, data);
  return response.data;
};

export const updateTicketPriority = async (
  entryId: string,
  data: { priority: string; reason?: string }
) => {
  const response = await api.patch(`/queues/entry/${entryId}/priority`, data);
  return response.data;
};

export const getQueuePolicy = async (queueId: string) => {
  const response = await api.get(`/queues/${queueId}/policy`);
  return response.data;
};

export const updateQueuePolicy = async (queueId: string, policy: any) => {
  const response = await api.patch(`/queues/${queueId}/policy`, policy);
  return response.data;
};

export const getBranchStaffAvailability = async (branchId: string) => {
  const response = await api.get(`/queues/branch/${branchId}/staff-availability`);
  return response.data;
};


