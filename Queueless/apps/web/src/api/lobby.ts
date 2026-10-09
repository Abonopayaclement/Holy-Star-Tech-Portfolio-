import api from './client';

export interface LobbyNowServingItem {
  entryId: string;
  ticketNumber: string;
  counterNumber: string;
  counterName?: string | null;
  serviceId: string;
  serviceName: string;
  status: 'CALLING' | 'SERVING';
  calledAt?: string | null;
  servingAt?: string | null;
}

export interface LobbyQueueOverviewItem {
  serviceId: string;
  serviceName: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
  activeCountersCount: number;
}

export interface LobbyState {
  branch: {
    id: string;
    name: string;
    organizationId: string;
    organizationName: string;
    operatingHours?: string | null;
  };
  displayMode: 'NOW_SERVING' | 'QUEUE_OVERVIEW' | 'COMBINED';
  nowServing: LobbyNowServingItem[];
  queueOverview: LobbyQueueOverviewItem[];
  announcement?: {
    latestCalledTicket?: string | null;
    latestCounter?: string | null;
    announcementText?: string | null;
  } | null;
  timestamp: string;
}

export interface LobbyDisplayConfig {
  id?: string;
  branchId: string;
  name?: string;
  mode: 'NOW_SERVING' | 'QUEUE_OVERVIEW' | 'COMBINED';
  voiceEnabled: boolean;
  announcementTemplate?: string;
  serviceIds?: string[];
}

export const getLobbyState = async (branchId: string): Promise<LobbyState> => {
  const res = await api.get(`/lobby/${branchId}/state`);
  return res.data;
};

export const getLobbyConfig = async (branchId: string): Promise<LobbyDisplayConfig> => {
  const res = await api.get(`/lobby/${branchId}/config`);
  return res.data;
};

export const updateLobbyConfig = async (
  branchId: string,
  data: Partial<LobbyDisplayConfig>
): Promise<LobbyDisplayConfig> => {
  const res = await api.put(`/lobby/${branchId}/config`, data);
  return res.data;
};
