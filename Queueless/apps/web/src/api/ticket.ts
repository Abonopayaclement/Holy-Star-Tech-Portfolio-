import api from './client';
import { PrintableTicket } from './kiosk';

export const getPrintableTicket = async (entryId: string): Promise<PrintableTicket> => {
  const res = await api.get(`/queues/entries/${entryId}/ticket`);
  return res.data;
};

export const reprintTicket = async (entryId: string, reason?: string): Promise<PrintableTicket> => {
  const res = await api.post(`/queues/entries/${entryId}/reprint`, { reason });
  return res.data;
};
