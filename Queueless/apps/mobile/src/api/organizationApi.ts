import apiClient from './client';
import { Organization, Branch, QRResolutionResult } from '../types';

export const organizationApi = {
  /**
   * Customer-safe public organization discovery
   */
  getPublicOrganizations: async (): Promise<Organization[]> => {
    try {
      const res = await apiClient.get<Organization[]>('/organizations/public');
      return res.data;
    } catch {
      const fallback = await apiClient.get<Organization[]>('/organizations');
      return fallback.data;
    }
  },

  getOrganizations: async (): Promise<Organization[]> => {
    const res = await apiClient.get<Organization[]>('/organizations');
    return res.data;
  },

  getBranch: async (branchId: string): Promise<Branch> => {
    const res = await apiClient.get<Branch>(`/organizations/branch/${branchId}`);
    return res.data;
  },

  resolveQr: async (code: string): Promise<QRResolutionResult> => {
    const encoded = encodeURIComponent(code);
    const res = await apiClient.get<QRResolutionResult>(`/organizations/resolve-qr/${encoded}`);
    return res.data;
  },
};

export default organizationApi;
