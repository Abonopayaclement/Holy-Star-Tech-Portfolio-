import api from './client';
import {
  AnalyticsFilterParams,
  ComprehensiveAnalyticsDashboardData,
  RealTimeOperationsSnapshot,
  QueueAnalyticsOverview,
  HourlyDemandMetric,
  DayOfWeekMetric,
  ServicePerformanceMetric,
  BranchPerformanceMetric,
  ChannelMetric,
  TransferMetric,
  QueueCongestionMetric,
  AppointmentAnalyticsMetric,
  CommunicationAnalyticsMetric,
  StaffPerformanceMetric,
  CounterAnalyticsMetric,
  OrganizationPerformanceMetric,
  SystemQueueMetric,
  PlatformUserMetric,
} from '../types/analytics';

const buildQueryParams = (params?: AnalyticsFilterParams): string => {
  if (!params) return '';
  const search = new URLSearchParams();
  if (params.organizationId) search.append('organizationId', params.organizationId);
  if (params.branchId) search.append('branchId', params.branchId);
  if (params.serviceId) search.append('serviceId', params.serviceId);
  if (params.dateRange) search.append('dateRange', params.dateRange);
  if (params.startDate) search.append('startDate', params.startDate);
  if (params.endDate) search.append('endDate', params.endDate);
  if (params.timezone) search.append('timezone', params.timezone);
  if (params.channel) search.append('channel', params.channel);
  if (params.priority) search.append('priority', params.priority);
  if (params.status) search.append('status', params.status);

  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const getDashboardAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<ComprehensiveAnalyticsDashboardData> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/dashboard${qs}`);
  return response.data;
};

export const getRealTimeAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<RealTimeOperationsSnapshot> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/realtime${qs}`);
  return response.data;
};

export const getQueueAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<QueueAnalyticsOverview> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/queue${qs}`);
  return response.data;
};

export const getDemandAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<{ hourlyDemand: HourlyDemandMetric[]; dayOfWeek: DayOfWeekMetric[] }> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/demand${qs}`);
  return response.data;
};

export const getServiceAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<ServicePerformanceMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/services${qs}`);
  return response.data;
};

export const getBranchAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<BranchPerformanceMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/branches${qs}`);
  return response.data;
};

export const getChannelAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<ChannelMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/channels${qs}`);
  return response.data;
};

export const getTransferAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<TransferMetric> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/transfers${qs}`);
  return response.data;
};

export const getCongestionAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<QueueCongestionMetric> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/congestion${qs}`);
  return response.data;
};

export const getAppointmentAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<AppointmentAnalyticsMetric> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/appointments${qs}`);
  return response.data;
};

export const getCommunicationAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<CommunicationAnalyticsMetric> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/communication${qs}`);
  return response.data;
};

export const getStaffAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<StaffPerformanceMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/staff${qs}`);
  return response.data;
};

export const getOrganizationAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<OrganizationPerformanceMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/organizations${qs}`);
  return response.data;
};

export const getQueuesAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<SystemQueueMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/queues${qs}`);
  return response.data;
};

export const getUsersAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<PlatformUserMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/users${qs}`);
  return response.data;
};

export const getCounterAnalytics = async (
  params?: AnalyticsFilterParams
): Promise<CounterAnalyticsMetric[]> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/counters${qs}`);
  return response.data;
};

export const downloadAnalyticsCsv = async (params?: AnalyticsFilterParams): Promise<void> => {
  const qs = buildQueryParams(params);
  const response = await api.get(`/analytics/export/csv${qs}`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `queueless-analytics-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
