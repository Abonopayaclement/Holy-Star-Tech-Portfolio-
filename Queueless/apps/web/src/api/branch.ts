import api from './client';

export const getMyProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.put('/users/profile', data);
  return response.data;
};

export const getAllOrganizations = async () => {
  const response = await api.get('/organizations');
  return response.data;
};

export const getOrganization = async (orgId: string) => {
  const response = await api.get(`/organizations/${orgId}`);
  return response.data;
};

export const updateOrganization = async (orgId: string, data: any) => {
  const response = await api.put(`/organizations/${orgId}`, data);
  return response.data;
};

export const getOrganizationAnalytics = async (orgId: string) => {
  const response = await api.get(`/organizations/${orgId}/analytics`);
  return response.data;
};

export const getBranchDetails = async (branchId: string) => {
  const response = await api.get(`/organizations/branch/${branchId}`);
  return response.data;
};

export const getBranchAnalytics = async (branchId: string) => {
  const response = await api.get(`/organizations/branch/${branchId}/analytics`);
  return response.data;
};

export const updateBranchDetails = async (branchId: string, data: any) => {
  const response = await api.put(`/organizations/branch/${branchId}`, data);
  return response.data;
};

export const createBranch = async (orgId: string, data: any) => {
  const response = await api.post(`/organizations/${orgId}/branch`, data);
  return response.data;
};

export const createService = async (branchId: string, data: any) => {
  const response = await api.post(`/organizations/branch/${branchId}/service`, data);
  return response.data;
};

export const updateService = async (serviceId: string, data: any) => {
  const response = await api.put(`/organizations/service/${serviceId}`, data);
  return response.data;
};

export const getBranchAppointments = async (branchId: string, date: string) => {
  const response = await api.get(`/appointments/branch/${branchId}?date=${date}`);
  return response.data;
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const response = await api.patch(`/appointments/${id}/status`, { status });
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await api.get('/appointments/my');
  return response.data;
};

export const createAppointment = async (data: {
  branchId: string;
  serviceId: string;
  scheduledTime: string;
  notes?: string;
}) => {
  const response = await api.post('/appointments', data);
  return response.data;
};

export const cancelAppointment = async (appointmentId: string) => {
  const response = await api.post(`/appointments/${appointmentId}/cancel`);
  return response.data;
};

export const rescheduleAppointment = async (appointmentId: string, scheduledTime: string) => {
  const response = await api.post(`/appointments/${appointmentId}/reschedule`, { scheduledTime });
  return response.data;
};

export const getAvailableAppointmentSlots = async (branchId: string, serviceId: string, date: string) => {
  const response = await api.get(`/appointments/available-slots?branchId=${branchId}&serviceId=${serviceId}&date=${date}`);
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

export const getBranchRemoteRequests = async (branchId: string, status?: string) => {
  const query = status && status !== 'ALL' ? `?status=${status}` : '';
  const response = await api.get(`/appointments/branch/${branchId}/requests${query}`);
  return response.data;
};

export const approveRemoteAppointment = async (appointmentId: string, fee: number) => {
  const response = await api.post(`/appointments/${appointmentId}/approve`, { fee });
  return response.data;
};

export const rejectRemoteAppointment = async (
  appointmentId: string,
  rejectionReason: string,
  rejectionNote?: string
) => {
  const response = await api.post(`/appointments/${appointmentId}/reject`, {
    rejectionReason,
    rejectionNote,
  });
  return response.data;
};

export const startRemoteAppointment = async (appointmentId: string) => {
  const response = await api.post(`/appointments/${appointmentId}/start`);
  return response.data;
};

export const completeRemoteAppointment = async (appointmentId: string) => {
  const response = await api.post(`/appointments/${appointmentId}/complete`);
  return response.data;
};

export const staffAppointmentFollowUpAction = async (
  appointmentId: string,
  payload: {
    action: 'DIRECT_TO_BRANCH' | 'CREATE_FOLLOWUP_ATTEMPT' | 'MARK_RESOLVED';
    instruction?: string;
  }
) => {
  const response = await api.post(`/appointments/${appointmentId}/staff-follow-up`, payload);
  return response.data;
};

export interface AppointmentCategory {
  id: string;
  organizationId: string;
  branchId?: string | null;
  serviceId?: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  branch?: { id: string; name: string };
  service?: { id: string; name: string };
}

export const getCategoriesForStaff = async (params?: { branchId?: string; serviceId?: string }) => {
  const query = new URLSearchParams();
  if (params?.branchId) query.append('branchId', params.branchId);
  if (params?.serviceId) query.append('serviceId', params.serviceId);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const response = await api.get(`/appointments/categories/manage${qs}`);
  return response.data as AppointmentCategory[];
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  branchId?: string | null;
  serviceId?: string | null;
}) => {
  const response = await api.post('/appointments/categories', data);
  return response.data as AppointmentCategory;
};

export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) => {
  const response = await api.put(`/appointments/categories/${id}`, data);
  return response.data as AppointmentCategory;
};

export const toggleCategoryActive = async (id: string) => {
  const response = await api.patch(`/appointments/categories/${id}/toggle`);
  return response.data as AppointmentCategory;
};

export const deleteCategory = async (id: string) => {
  const response = await api.delete(`/appointments/categories/${id}`);
  return response.data;
};

// --- Super Admin Executive & Platform Oversight APIs ---
export const getExecutiveAnalytics = async (period: string = 'last_7_days') => {
  const response = await api.get(`/analytics/executive?period=${period}`);
  return response.data;
};

export const getQueueOversight = async (params: any = {}) => {
  const response = await api.get('/analytics/queue-oversight', { params });
  return response.data;
};

export const getPlatformAppointments = async (params: any = {}) => {
  const response = await api.get('/appointments/platform-overview', { params });
  return response.data;
};

export const getPendingOrganizations = async () => {
  const response = await api.get('/organizations/pending');
  return response.data;
};

export const approveOrganization = async (orgId: string) => {
  const response = await api.post(`/organizations/${orgId}/approve`);
  return response.data;
};

export const rejectOrganization = async (orgId: string, reason?: string) => {
  const response = await api.post(`/organizations/${orgId}/reject`, { reason });
  return response.data;
};

export const getOrganizationDetailsForAdmin = async (orgId: string) => {
  const response = await api.get(`/organizations/${orgId}/details`);
  return response.data;
};

export const registerOrganization = async (data: any) => {
  const response = await api.post('/organizations/register', data);
  return response.data;
};

export const getOrgStaff = async (orgId: string) => {
  const response = await api.get(`/organizations/${orgId}/staff`);
  return response.data;
};

export const createOrgStaff = async (orgId: string, data: any) => {
  const response = await api.post(`/organizations/${orgId}/staff`, data);
  return response.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const response = await api.put('/users/change-password', data);
  return response.data;
};

