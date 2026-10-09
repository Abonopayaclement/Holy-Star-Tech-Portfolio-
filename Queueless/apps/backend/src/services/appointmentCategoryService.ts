import prisma from '../config/prisma';
import { canAccessOrganization, canAccessBranch, UserContext } from '../utils/tenant';

export interface CreateCategoryInput {
  organizationId: string;
  branchId?: string | null;
  serviceId?: string | null;
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

/**
 * Customer facing: Get active categories for a branch / service desk.
 * Tenant Isolation Guarantee:
 * Strictly resolves the branch's organization, returning ONLY categories
 * belonging to that organization (and optional branch/service scope).
 */
export const getActiveCategories = async (branchId: string, serviceId?: string) => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, organizationId: true },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  // Find categories matching this organization, either org-wide or scoped to this branch/service
  const conditions: any[] = [
    { organizationId: branch.organizationId },
    { isActive: true },
    {
      OR: [
        { branchId: null },
        { branchId: branch.id },
      ],
    },
  ];

  if (serviceId) {
    conditions.push({
      OR: [
        { serviceId: null },
        { serviceId: serviceId },
      ],
    });
  }

  return prisma.appointmentCategory.findMany({
    where: {
      AND: conditions,
    },
    orderBy: [
      { name: 'asc' },
    ],
    include: {
      service: {
        select: { id: true, name: true },
      },
      branch: {
        select: { id: true, name: true },
      },
    },
  });
};

/**
 * Staff facing: Get all categories for an organization or branch (including inactive ones)
 */
export const getCategoriesForStaff = async (user: UserContext, branchId?: string, organizationId?: string) => {
  let targetOrgId = organizationId;

  if (branchId) {
    const hasAccess = await canAccessBranch(user, branchId);
    if (!hasAccess) {
      throw new Error('Unauthorized: You do not have access to this branch');
    }
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { organizationId: true },
    });
    if (!branch) throw new Error('Branch not found');
    targetOrgId = branch.organizationId;
  } else if (targetOrgId) {
    if (!canAccessOrganization(user, targetOrgId)) {
      throw new Error('Unauthorized: You do not have access to this organization');
    }
  } else if (user.organizationId) {
    targetOrgId = user.organizationId;
  } else if (user.role !== 'SUPER_ADMIN') {
    throw new Error('Missing organization or branch context');
  }

  const whereClause: any = {};
  if (targetOrgId) {
    whereClause.organizationId = targetOrgId;
  }
  if (branchId) {
    whereClause.OR = [
      { branchId: null },
      { branchId: branchId },
    ];
  }

  return prisma.appointmentCategory.findMany({
    where: whereClause,
    orderBy: [
      { isActive: 'desc' },
      { name: 'asc' },
    ],
    include: {
      service: {
        select: { id: true, name: true },
      },
      branch: {
        select: { id: true, name: true },
      },
      _count: {
        select: { appointments: true },
      },
    },
  });
};

/**
 * Staff / Admin: Create a new appointment category
 */
export const createCategory = async (user: UserContext, data: CreateCategoryInput) => {
  if (!data.name || !data.name.trim()) {
    throw new Error('Category name is required');
  }

  if (!canAccessOrganization(user, data.organizationId)) {
    throw new Error('Unauthorized: You cannot create categories for this organization');
  }

  if (data.branchId) {
    const hasAccess = await canAccessBranch(user, data.branchId);
    if (!hasAccess) {
      throw new Error('Unauthorized: You cannot scope categories to this branch');
    }
    // Verify branch belongs to org
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
      select: { organizationId: true },
    });
    if (!branch || branch.organizationId !== data.organizationId) {
      throw new Error('Branch does not belong to the specified organization');
    }
  }

  if (data.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      include: { branch: true },
    });
    if (!service || service.branch.organizationId !== data.organizationId) {
      throw new Error('Service desk does not belong to the specified organization');
    }
  }

  return prisma.appointmentCategory.create({
    data: {
      organizationId: data.organizationId,
      branchId: data.branchId || null,
      serviceId: data.serviceId || null,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      isActive: true,
    },
    include: {
      service: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  });
};

/**
 * Staff / Admin: Update an appointment category
 */
export const updateCategory = async (user: UserContext, id: string, data: UpdateCategoryInput) => {
  const existing = await prisma.appointmentCategory.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Appointment category not found');
  }

  if (!canAccessOrganization(user, existing.organizationId)) {
    throw new Error('Unauthorized: You cannot modify this category');
  }

  return prisma.appointmentCategory.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      service: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  });
};

/**
 * Staff / Admin: Toggle active state of category
 */
export const toggleCategoryActive = async (user: UserContext, id: string) => {
  const existing = await prisma.appointmentCategory.findUnique({
    where: { id },
    select: { id: true, organizationId: true, isActive: true },
  });

  if (!existing) {
    throw new Error('Appointment category not found');
  }

  if (!canAccessOrganization(user, existing.organizationId)) {
    throw new Error('Unauthorized: You cannot modify this category');
  }

  return prisma.appointmentCategory.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  });
};

/**
 * Staff / Admin: Delete or archive category
 * If category has existing historical appointments, soft-delete by setting isActive = false.
 * Otherwise, hard-delete.
 */
export const deleteCategory = async (user: UserContext, id: string) => {
  const existing = await prisma.appointmentCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  });

  if (!existing) {
    throw new Error('Appointment category not found');
  }

  if (!canAccessOrganization(user, existing.organizationId)) {
    throw new Error('Unauthorized: You cannot delete this category');
  }

  if (existing._count.appointments > 0) {
    // Soft delete to protect appointment history
    return prisma.appointmentCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return prisma.appointmentCategory.delete({
    where: { id },
  });
};
