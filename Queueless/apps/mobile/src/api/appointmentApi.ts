import apiClient from './client';
import { Appointment, AppointmentCategory } from '../types';

export interface CreateAppointmentPayload {
  branchId: string;
  serviceId: string;
  scheduledTime?: string;
  notes?: string;
}

export interface CreateRemoteRequestPayload {
  branchId: string;
  serviceId: string;
  categoryId?: string;
  problemType: string;
  notes?: string;
}

export const appointmentApi = {
  getCategories: async (
    branchId: string,
    serviceId?: string
  ): Promise<AppointmentCategory[]> => {
    const res = await apiClient.get<AppointmentCategory[]>('/appointments/categories', {
      params: { branchId, serviceId },
    });
    return res.data;
  },

  getAvailableSlots: async (
    branchId: string,
    serviceId: string,
    date: string
  ): Promise<string[]> => {
    const res = await apiClient.get<string[]>('/appointments/available-slots', {
      params: { branchId, serviceId, date },
    });
    return res.data;
  },

  createAppointment: async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>('/appointments', payload);
    return res.data;
  },

  createRemoteRequest: async (payload: CreateRemoteRequestPayload): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>('/appointments/request', payload);
    return res.data;
  },

  getMyAppointments: async (): Promise<Appointment[]> => {
    const res = await apiClient.get<Appointment[]>('/appointments/my');
    return res.data;
  },

  getAppointmentDetails: async (appointmentId: string): Promise<Appointment> => {
    const res = await apiClient.get<Appointment>(`/appointments/${appointmentId}/details`);
    return res.data;
  },

  payAppointment: async (appointmentId: string): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>(`/appointments/${appointmentId}/pay`);
    return res.data;
  },

  submitFeedback: async (
    appointmentId: string,
    payload: { isProblemSolved: boolean; feedbackNotes?: string }
  ): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>(`/appointments/${appointmentId}/feedback`, payload);
    return res.data;
  },

  cancelAppointment: async (appointmentId: string): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>(`/appointments/${appointmentId}/cancel`);
    return res.data;
  },

  rescheduleAppointment: async (
    appointmentId: string,
    scheduledTime: string
  ): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>(`/appointments/${appointmentId}/reschedule`, {
      scheduledTime,
    });
    return res.data;
  },

  requestFollowUp: async (
    appointmentId: string,
    followUpNote?: string
  ): Promise<Appointment> => {
    const res = await apiClient.post<Appointment>(`/appointments/${appointmentId}/follow-up`, {
      followUpNote,
    });
    return res.data;
  },

  hideAppointment: async (appointmentId: string): Promise<void> => {
    await apiClient.patch(`/appointments/${appointmentId}/hide`);
  },
};

export default appointmentApi;
