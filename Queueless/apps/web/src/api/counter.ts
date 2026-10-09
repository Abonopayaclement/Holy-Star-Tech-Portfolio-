import api from './client';

export interface ServiceCounter {
  id: string;
  branchId: string;
  counterNumber: string;
  name?: string | null;
  status: 'AVAILABLE' | 'SERVING' | 'PAUSED' | 'OFFLINE';
  currentTicketNumber?: string | null;
  currentEntryId?: string | null;
  currentStaffId?: string | null;
  currentStaff?: { id: string; fullName: string; email?: string } | null;
  currentServiceId?: string | null;
  currentService?: { id: string; name: string } | null;
  isActive: boolean;
}

export const getCounters = async (branchId: string): Promise<ServiceCounter[]> => {
  const res = await api.get(`/counters/branch/${branchId}`);
  return res.data;
};

export const createCounter = async (data: {
  branchId: string;
  counterNumber: string;
  name?: string;
}): Promise<ServiceCounter> => {
  const res = await api.post('/counters', data);
  return res.data;
};

export const updateCounterStatus = async (
  counterId: string,
  status: string,
  extraDetails?: { ticketNumber?: string; entryId?: string; serviceId?: string }
): Promise<ServiceCounter> => {
  const res = await api.patch(`/counters/${counterId}/status`, { status, ...extraDetails });
  return res.data;
};

export const assignStaffToCounter = async (
  counterId: string,
  data?: { staffId?: string; serviceId?: string }
): Promise<ServiceCounter> => {
  const res = await api.post(`/counters/${counterId}/assign`, data || {});
  return res.data;
};

export const deleteCounter = async (counterId: string): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(`/counters/${counterId}`);
  return res.data;
};
