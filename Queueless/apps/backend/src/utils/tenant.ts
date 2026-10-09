import { Role } from '@prisma/client';
import prisma from '../config/prisma';

export interface UserContext {
  id: string;
  email: string;
  role: Role;
  organizationId?: string | null;
  staffBranchId?: string | null;
}

/**
 * Checks if the requesting user has authority over a specific organization.
 */
export const canAccessOrganization = (user: UserContext, organizationId: string): boolean => {
  if (user.role === Role.SUPER_ADMIN) return true;
  if (!user.organizationId) return false;
  return user.organizationId === organizationId;
};

/**
 * Checks if the requesting user has authority over a specific branch.
 */
export const canAccessBranch = async (user: UserContext, branchId: string): Promise<boolean> => {
  if (user.role === Role.SUPER_ADMIN) return true;

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { organizationId: true, managers: { select: { id: true } } },
  });

  if (!branch) return false;

  // Organization Admin of the branch's organization
  if (user.role === Role.ORG_ADMIN && user.organizationId === branch.organizationId) {
    return true;
  }

  // Branch Manager assigned to this branch
  if (user.role === Role.BRANCH_MANAGER) {
    const isManager = branch.managers.some((m) => m.id === user.id);
    if (isManager) return true;
    if (user.organizationId && user.organizationId === branch.organizationId) return true;
  }

  // Staff member assigned to this branch
  if (user.role === Role.STAFF && user.staffBranchId === branchId) {
    return true;
  }

  return false;
};

/**
 * Returns tenant scoping filter for branch queries
 */
export const getBranchScopeForUser = (user: UserContext) => {
  if (user.role === Role.SUPER_ADMIN) {
    return {};
  }
  if (user.role === Role.ORG_ADMIN && user.organizationId) {
    return { organizationId: user.organizationId };
  }
  if (user.role === Role.BRANCH_MANAGER) {
    return {
      OR: [
        { managers: { some: { id: user.id } } },
        ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
      ],
    };
  }
  if (user.role === Role.STAFF && user.staffBranchId) {
    return { id: user.staffBranchId };
  }
  return { id: 'none' };
};
