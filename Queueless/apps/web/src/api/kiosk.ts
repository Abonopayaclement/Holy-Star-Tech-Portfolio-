import api from './client';

export interface KioskServiceItem {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  queueId: string;
  queueStatus: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
  isFull: boolean;
}

export interface KioskBranchData {
  branch: {
    id: string;
    name: string;
    location?: string;
    operatingHours?: string;
    organizationName: string;
    organizationLogo?: string;
  };
  services: KioskServiceItem[];
}

export interface PrintableTicket {
  ticketId: string;
  entryId: string;
  ticketNumber: string;
  organizationName: string;
  branchName: string;
  branchLocation?: string;
  serviceName: string;
  counterNumber?: string | null;
  position: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  issuedAt: string;
  formattedDate: string;
  formattedTime: string;
  instruction: string;
  reprintCount: number;
  source: string;
  poweredBy: string;
}

export const getKioskServices = async (branchId: string, kioskId?: string): Promise<KioskBranchData> => {
  const url = kioskId ? `/kiosks/public/${branchId}?kioskId=${kioskId}` : `/kiosks/public/${branchId}`;
  const res = await api.get(url);
  return res.data;
};

export const issueKioskTicket = async (data: {
  branchId: string;
  serviceId: string;
  kioskId?: string;
  fullName?: string;
  phoneNumber?: string;
}): Promise<PrintableTicket> => {
  const res = await api.post('/kiosks/ticket', data);
  return res.data;
};

export const getBranchKiosks = async (branchId: string) => {
  const res = await api.get(`/kiosks/branch/${branchId}`);
  return res.data;
};

export const createKiosk = async (data: {
  branchId: string;
  name: string;
  deviceIdentifier?: string;
  config?: Record<string, any>;
}) => {
  const res = await api.post('/kiosks', data);
  return res.data;
};

export const updateKiosk = async (
  id: string,
  data: { name?: string; status?: string; config?: Record<string, any> }
) => {
  const res = await api.patch(`/kiosks/${id}`, data);
  return res.data;
};
