import apiClient from './client';
import { User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    // Role is strictly locked to CUSTOMER
    const res = await apiClient.post<AuthResponse>('/auth/register', {
      ...payload,
      role: 'CUSTOMER',
    });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.put<User>('/users/profile', data);
    return res.data;
  },
};

export default authApi;
