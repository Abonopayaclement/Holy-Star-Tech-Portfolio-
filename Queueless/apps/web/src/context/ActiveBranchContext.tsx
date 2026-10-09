import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProfile } from '../api/branch';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

export interface BranchOption {
  id: string;
  name: string;
  location?: string;
  organizationId?: string;
  operatingHours?: string;
}

export interface ActiveBranchContextType {
  activeBranchId: string;
  activeBranch: BranchOption | null;
  availableBranches: BranchOption[];
  isManager: boolean;
  canSwitchBranch: boolean;
  setActiveBranchId: (branchId: string) => void;
  isLoading: boolean;
}

const ActiveBranchContext = createContext<ActiveBranchContextType>({
  activeBranchId: '',
  activeBranch: null,
  availableBranches: [],
  isManager: false,
  canSwitchBranch: false,
  setActiveBranchId: () => {},
  isLoading: true,
});

const ACTIVE_BRANCH_STORAGE_KEY = 'queueless_active_branch_id';

export const ActiveBranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
    enabled: !!user,
  });

  // 2. Fetch public organizations/branches to allow organization-wide branch switching for managers
  const { data: publicOrgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['public-orgs-discovery'],
    queryFn: async () => {
      const res = await api.get('/organizations/public');
      return res.data;
    },
    enabled: !!user && user.role !== 'CUSTOMER',
  });

  // Determine if user has managerial branch-switching authority
  const isManager = useMemo(() => {
    if (!user) return false;
    const role = user.role;
    if (role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'BRANCH_MANAGER') {
      return true;
    }
    if (profile?.managedBranches && profile.managedBranches.length > 1) {
      return true;
    }
    return false;
  }, [user, profile]);

  // Determine available branches according to role & tenant scoping
  const availableBranches = useMemo<BranchOption[]>(() => {
    if (!user) return [];

    // Ordinary staff: strictly assigned to their single branch
    if (user.role === 'STAFF') {
      if (profile?.staffBranch) {
        return [
          {
            id: profile.staffBranch.id,
            name: profile.staffBranch.name,
            location: profile.staffBranch.location,
            organizationId: profile.staffBranch.organizationId,
          },
        ];
      }
      if (profile?.staffBranchId) {
        return [
          {
            id: profile.staffBranchId,
            name: 'Assigned Branch',
          },
        ];
      }
      return [];
    }

    // Super Admin: access to all branches across all organizations
    if (user.role === 'SUPER_ADMIN' && Array.isArray(publicOrgs)) {
      const allBranches: BranchOption[] = [];
      publicOrgs.forEach((org: any) => {
        if (Array.isArray(org.branches)) {
          org.branches.forEach((b: any) => {
            if (!allBranches.some((existing) => existing.id === b.id)) {
              allBranches.push({
                id: b.id,
                name: `${b.name} (${org.name})`,
                location: b.location,
                organizationId: org.id,
                operatingHours: b.operatingHours,
              });
            }
          });
        }
      });
      if (allBranches.length > 0) return allBranches;
    }

    // Branch Manager & Org Admin: find branches for user's organization and explicitly managed branches
    const userOrgId =
      user.organizationId ||
      profile?.organizationId ||
      profile?.staffBranch?.organizationId ||
      profile?.managedBranches?.[0]?.organizationId;

    const branchMap = new Map<string, BranchOption>();

    // Add explicitly managed branches first
    if (Array.isArray(profile?.managedBranches)) {
      profile.managedBranches.forEach((b: any) => {
        if (b && b.id) {
          branchMap.set(b.id, {
            id: b.id,
            name: b.name,
            location: b.location,
            organizationId: b.organizationId,
            operatingHours: b.operatingHours,
          });
        }
      });
    }

    // Add branches from public discovery belonging to their organization
    if (Array.isArray(publicOrgs) && userOrgId) {
      const org = publicOrgs.find((o: any) => o.id === userOrgId);
      if (org && Array.isArray(org.branches)) {
        org.branches.forEach((b: any) => {
          if (!branchMap.has(b.id)) {
            branchMap.set(b.id, {
              id: b.id,
              name: b.name,
              location: b.location,
              organizationId: org.id,
              operatingHours: b.operatingHours,
            });
          }
        });
      }
    }

    // Add branches from user's organization profile directly
    if (profile?.organization && Array.isArray(profile.organization.branches)) {
      profile.organization.branches.forEach((b: any) => {
        if (!branchMap.has(b.id)) {
          branchMap.set(b.id, {
            id: b.id,
            name: b.name,
            location: b.location,
            organizationId: profile.organization.id,
            operatingHours: b.operatingHours,
          });
        }
      });
    }

    // Also include staffBranch if present
    if (profile?.staffBranch && !branchMap.has(profile.staffBranch.id)) {
      branchMap.set(profile.staffBranch.id, {
        id: profile.staffBranch.id,
        name: profile.staffBranch.name,
        location: profile.staffBranch.location,
        organizationId: profile.staffBranch.organizationId,
      });
    }

    return Array.from(branchMap.values());
  }, [user, profile, publicOrgs]);

  const canSwitchBranch = isManager && availableBranches.length > 1;

  // Active branch ID state
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || '';
  });

  // Keep activeBranchId synchronized when availableBranches load
  useEffect(() => {
    if (availableBranches.length === 0) {
      if (activeBranchId !== '') {
        setActiveBranchIdState('');
        localStorage.removeItem(ACTIVE_BRANCH_STORAGE_KEY);
      }
      return;
    }

    const savedId = localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
    const isSavedValid = Boolean(savedId && availableBranches.some((b) => b.id === savedId));

    if (isSavedValid && savedId) {
      if (activeBranchId !== savedId) {
        setActiveBranchIdState(savedId);
      }
    } else {
      // Pick best default strictly from availableBranches
      const defaultId =
        (profile?.staffBranchId && availableBranches.some((b) => b.id === profile.staffBranchId) ? profile.staffBranchId : null) ||
        (profile?.managedBranches?.[0]?.id && availableBranches.some((b) => b.id === profile.managedBranches[0].id) ? profile.managedBranches[0].id : null) ||
        availableBranches[0]?.id ||
        '';

      if (defaultId && defaultId !== activeBranchId) {
        setActiveBranchIdState(defaultId);
        localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, defaultId);
      }
    }
  }, [availableBranches, profile, activeBranchId]);

  const setActiveBranchId = useCallback(
    (newBranchId: string) => {
      if (!newBranchId) return;
      setActiveBranchIdState(newBranchId);
      localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, newBranchId);

      // Invalidate relevant React Query caches across the app
      queryClient.invalidateQueries({ queryKey: ['branch'] });
      queryClient.invalidateQueries({ queryKey: ['branch-details'] });
      queryClient.invalidateQueries({ queryKey: ['live-queue'] });
      queryClient.invalidateQueries({ queryKey: ['branch-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['branch-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['remote-requests'] });
      queryClient.invalidateQueries({ queryKey: ['physical-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['qr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
    },
    [queryClient]
  );

  const activeBranch = useMemo(() => {
    if (availableBranches.length === 0) return null;
    return availableBranches.find((b) => b.id === activeBranchId) || availableBranches[0] || null;
  }, [availableBranches, activeBranchId]);

  const isLoading = profileLoading || (user?.role !== 'CUSTOMER' && orgsLoading && availableBranches.length === 0);

  return (
    <ActiveBranchContext.Provider
      value={{
        activeBranchId: activeBranch ? activeBranch.id : '',
        activeBranch,
        availableBranches,
        isManager,
        canSwitchBranch,
        setActiveBranchId,
        isLoading,
      }}
    >
      {children}
    </ActiveBranchContext.Provider>
  );
};

export const useActiveBranch = () => useContext(ActiveBranchContext);
