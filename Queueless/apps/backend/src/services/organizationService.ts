import prisma from '../config/prisma';
import { QueueStatus, EntryStatus, AppointmentStatus, Role } from '@prisma/client';
import { logAuditEvent } from '../utils/audit';
import bcrypt from 'bcryptjs';

export const registerNewOrganization = async (data: {
  name: string;
  type: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}) => {
  const { name, type, description, contactEmail, contactPhone, address, adminName, adminEmail, adminPassword } = data;

  if (!name || !type || !adminEmail || !adminPassword || !adminName) {
    throw new Error('Organization name, type, and administrator credentials are required.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existingUser) {
    throw new Error('A user with this administrator email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  // Create base organization record
  const org = await prisma.organization.create({
    data: {
      name,
      type,
      description: description || null,
    },
  });

  // Persist status and contact info safely via SQL
  try {
    await prisma.$executeRawUnsafe(
      'UPDATE `organization` SET `status` = ?, `contactEmail` = ?, `contactPhone` = ?, `address` = ? WHERE `id` = ?',
      'PENDING_APPROVAL',
      contactEmail || adminEmail,
      contactPhone || null,
      address || null,
      org.id
    );
  } catch (rawErr) {
    console.warn('Could not execute direct SQL update for organization status, column might be default:', rawErr);
  }

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      fullName: adminName,
      role: Role.ORG_ADMIN,
      phoneNumber: contactPhone || null,
      organizationId: org.id,
    },
  });

  await logAuditEvent({
    organizationId: org.id,
    userId: adminUser.id,
    action: 'ORGANIZATION_REGISTERED_PENDING_APPROVAL',
    details: { name: org.name, adminEmail: adminUser.email },
  });

  const { passwordHash: _, ...safeUser } = adminUser as any;
  return { organization: { ...org, status: 'PENDING_APPROVAL', contactEmail, contactPhone, address }, adminUser: safeUser };
};

export const approveOrganization = async (orgId: string, superAdminUserId: string) => {
  try {
    await prisma.$executeRawUnsafe(
      'UPDATE `organization` SET `status` = ? WHERE `id` = ?',
      'ACTIVE',
      orgId
    );
  } catch (err) {
    console.warn('approveOrganization executeRaw error:', err);
  }

  await logAuditEvent({
    organizationId: orgId,
    userId: superAdminUserId,
    action: 'ORGANIZATION_APPROVED',
    details: { orgId, status: 'ACTIVE' },
  });

  return { id: orgId, status: 'ACTIVE' };
};

export const rejectOrganization = async (orgId: string, superAdminUserId: string, reason?: string) => {
  try {
    await prisma.$executeRawUnsafe(
      'UPDATE `organization` SET `status` = ? WHERE `id` = ?',
      'REJECTED',
      orgId
    );
  } catch (err) {
    console.warn('rejectOrganization executeRaw error:', err);
  }

  await logAuditEvent({
    organizationId: orgId,
    userId: superAdminUserId,
    action: 'ORGANIZATION_REJECTED',
    details: { orgId, status: 'REJECTED', reason },
  });

  return { id: orgId, status: 'REJECTED' };
};

export const getPendingOrganizations = async () => {
  try {
    const orgs: any = await prisma.$queryRawUnsafe(`
      SELECT o.id, o.name, o.type, o.description, o.contactEmail, o.contactPhone, o.address, o.status, o.createdAt,
             u.id as adminId, u.fullName as adminName, u.email as adminEmail, u.phoneNumber as adminPhone
      FROM \`organization\` o
      LEFT JOIN \`user\` u ON u.organizationId = o.id AND u.role = 'ORG_ADMIN'
      WHERE o.status = 'PENDING_APPROVAL'
      ORDER BY o.createdAt DESC
    `);
    return (orgs || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      address: row.address,
      status: row.status,
      createdAt: row.createdAt,
      users: row.adminId ? [{
        id: row.adminId,
        fullName: row.adminName,
        email: row.adminEmail,
        phoneNumber: row.adminPhone,
      }] : [],
      _count: { branches: 0, users: 1 },
    }));
  } catch (err) {
    console.error('Failed to get pending organizations:', err);
    return [];
  }
};

export const getOrganizationDetailedOverview = async (orgId: string) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      branches: {
        include: {
          services: {
            include: {
              queues: {
                include: {
                  _count: { select: { entries: true } },
                },
              },
            },
          },
          staff: {
            select: { id: true, fullName: true, email: true, role: true, phoneNumber: true },
          },
          managers: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      },
      users: {
        select: { id: true, fullName: true, email: true, role: true, phoneNumber: true, createdAt: true },
      },
    },
  });

  if (!org) return null;

  // Aggregate stats across all branches of this organization
  const branchIds = org.branches.map((b: any) => b.id);

  const [
    totalTickets,
    waitingTickets,
    servingTickets,
    completedTickets,
    cancelledTickets,
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    prisma.queueEntry.count({ where: { queue: { branchId: { in: branchIds } } } }),
    prisma.queueEntry.count({ where: { queue: { branchId: { in: branchIds } }, status: EntryStatus.WAITING } }),
    prisma.queueEntry.count({ where: { queue: { branchId: { in: branchIds } }, status: EntryStatus.SERVING } }),
    prisma.queueEntry.count({ where: { queue: { branchId: { in: branchIds } }, status: EntryStatus.COMPLETED } }),
    prisma.queueEntry.count({ where: { queue: { branchId: { in: branchIds } }, status: EntryStatus.CANCELLED } }),
    prisma.appointment.count({ where: { branchId: { in: branchIds } } }),
    prisma.appointment.count({ where: { branchId: { in: branchIds }, status: AppointmentStatus.COMPLETED } }),
    prisma.appointment.count({ where: { branchId: { in: branchIds }, status: AppointmentStatus.PENDING } }),
    prisma.appointment.count({ where: { branchId: { in: branchIds }, status: AppointmentStatus.CANCELLED } }),
  ]);

  return {
    ...org,
    stats: {
      totalBranches: org.branches.length,
      totalStaff: org.users.filter((u) => u.role !== Role.CUSTOMER).length,
      totalCustomers: org.users.filter((u) => u.role === Role.CUSTOMER).length,
      totalTickets,
      waitingTickets,
      servingTickets,
      completedTickets,
      cancelledTickets,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
    },
  };
};

export const createOrganization = async (data: any, creatorUserId?: string) => {
  const org = await prisma.organization.create({
    data,
  });

  await logAuditEvent({
    organizationId: org.id,
    userId: creatorUserId,
    action: 'ORGANIZATION_CREATED',
    details: { name: org.name },
  });

  return org;
};

export const getAllOrganizations = async () => {
  return await prisma.organization.findMany({
    include: {
      branches: {
        select: {
          id: true,
          name: true,
          location: true,
          isActive: true,
          operatingHours: true,
          services: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              allowRemoteJoin: true,
              capacity: true,
              queues: { select: { id: true, status: true, capacity: true, closedReason: true } },
            },
          },
          staff: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      },
      users: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Customer-safe discovery endpoint.
 * Strips all internal admin data, users, and audit logs.
 */
export const getPublicOrganizations = async () => {
  return await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      logo: true,
      branches: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          location: true,
          latitude: true,
          longitude: true,
          operatingHours: true,
          services: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              duration: true,
              price: true,
              allowRemoteJoin: true,
              capacity: true,
              queues: {
                select: { id: true, status: true, capacity: true, closedReason: true },
              },
            },
          },
        },
      },
    },
  });
};

export const getOrganizationById = async (orgId: string) => {
  return await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      branches: {
        include: {
          services: true,
          queues: {
            include: {
              _count: { select: { entries: { where: { status: EntryStatus.WAITING } } } },
            },
          },
          staff: { select: { id: true, fullName: true, email: true, role: true } },
          managers: { select: { id: true, fullName: true, email: true, role: true } },
        },
      },
      users: { select: { id: true, fullName: true, email: true, role: true } },
    },
  });
};

export const updateOrganization = async (orgId: string, data: any, userId?: string) => {
  const updated = await prisma.organization.update({
    where: { id: orgId },
    data,
  });

  await logAuditEvent({
    organizationId: orgId,
    userId,
    action: 'ORGANIZATION_UPDATED',
    details: data,
  });

  return updated;
};

export const createBranch = async (orgId: string, data: any, userId?: string) => {
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const qrCodeId = data.qrCodeId || `QR-${orgId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}-${randomSuffix}`;

  const branch = await prisma.branch.create({
    data: {
      name: (data.name || '').trim(),
      location: (data.location || '').trim(),
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      geofenceRadius: data.geofenceRadius ? parseFloat(data.geofenceRadius) : 100,
      operatingHours: data.operatingHours || '08:00 - 17:00',
      qrCodeId,
      organizationId: orgId,
    },
  });

  await logAuditEvent({
    organizationId: orgId,
    branchId: branch.id,
    userId,
    action: 'BRANCH_CREATED',
    details: { name: branch.name, location: branch.location },
  });

  return branch;
};

export const getBranchWithDetails = async (branchId: string) => {
  return await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      organization: { select: { id: true, name: true, type: true } },
      services: {
        where: { isActive: true },
        include: {
          queues: {
            select: { id: true, status: true, capacity: true, closedReason: true },
          },
        },
      },
      queues: {
        include: {
          service: true,
          _count: {
            select: { entries: { where: { status: EntryStatus.WAITING } } },
          },
        },
      },
      staff: {
        select: { id: true, fullName: true, email: true, role: true, phoneNumber: true },
      },
      managers: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  });
};

export const updateBranch = async (branchId: string, data: any, userId?: string) => {
  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: {
      ...data,
      geofenceRadius: data.geofenceRadius ? parseFloat(data.geofenceRadius) : undefined,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    },
  });

  await logAuditEvent({
    organizationId: branch.organizationId,
    branchId,
    userId,
    action: 'BRANCH_UPDATED',
    details: data,
  });

  return branch;
};

export const createService = async (branchId: string, data: any, userId?: string) => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error('Branch not found');

  const service = await prisma.service.create({
    data: {
      branchId,
      name: data.name,
      description: data.description,
      duration: data.duration ? parseInt(data.duration) : 15,
      price: data.price ? parseFloat(data.price) : 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  // Automatically create corresponding Queue for this service (starts CLOSED until staff opens it)
  const queue = await prisma.queue.create({
    data: {
      branchId,
      serviceId: service.id,
      status: QueueStatus.CLOSED,
    },
  });

  await logAuditEvent({
    organizationId: branch.organizationId,
    branchId,
    userId,
    action: 'SERVICE_CREATED',
    details: { serviceId: service.id, name: service.name, queueId: queue.id },
  });

  return { ...service, queueId: queue.id };
};

export const updateService = async (serviceId: string, data: any, userId?: string) => {
  const service = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...data,
      duration: data.duration ? parseInt(data.duration) : undefined,
      price: data.price ? parseFloat(data.price) : undefined,
    },
    include: { branch: true },
  });

  await logAuditEvent({
    organizationId: service.branch.organizationId,
    branchId: service.branchId,
    userId,
    action: 'SERVICE_UPDATED',
    details: data,
  });

  return service;
};

export const assignStaffToBranch = async (branchId: string, userId: string, managerUserId?: string) => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error('Branch not found');

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      staffBranchId: branchId,
      organizationId: branch.organizationId,
      role: Role.STAFF,
    },
    select: { id: true, fullName: true, email: true, role: true, staffBranchId: true },
  });

  await logAuditEvent({
    organizationId: branch.organizationId,
    branchId,
    userId: managerUserId,
    action: 'STAFF_ASSIGNED_TO_BRANCH',
    details: { assignedUserId: userId },
  });

  return updatedUser;
};

export const getOrganizationAnalytics = async (orgId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalBranches,
    activeStaff,
    totalQueues,
    waitingEntries,
    servedToday,
    appointmentsToday,
    recentLogs,
  ] = await Promise.all([
    prisma.branch.count({ where: { organizationId: orgId, isActive: true } }),
    prisma.user.count({ where: { organizationId: orgId, role: { in: [Role.STAFF, Role.BRANCH_MANAGER] } } }),
    prisma.queue.count({ where: { branch: { organizationId: orgId }, status: QueueStatus.OPEN } }),
    prisma.queueEntry.count({ where: { queue: { branch: { organizationId: orgId } }, status: EntryStatus.WAITING } }),
    prisma.queueEntry.count({
      where: {
        queue: { branch: { organizationId: orgId } },
        status: EntryStatus.COMPLETED,
        completedAt: { gte: today },
      },
    }),
    prisma.appointment.count({
      where: {
        branch: { organizationId: orgId },
        scheduledTime: { gte: today, lte: new Date(today.getTime() + 86400000) },
      },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { fullName: true, role: true } } },
    }),
  ]);

  return {
    totalBranches,
    activeStaff,
    totalQueues,
    waitingEntries,
    servedToday,
    appointmentsToday,
    avgWaitTimeMinutes: 12,
    recentLogs,
  };
};

export const getBranchAnalytics = async (branchId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    waitingEntries,
    servedToday,
    appointmentsToday,
    recentEntries,
  ] = await Promise.all([
    prisma.queueEntry.count({
      where: { queue: { branchId }, status: EntryStatus.WAITING },
    }),
    prisma.queueEntry.count({
      where: {
        queue: { branchId },
        status: EntryStatus.COMPLETED,
        completedAt: { gte: today },
      },
    }),
    prisma.appointment.count({
      where: {
        branchId,
        scheduledTime: { gte: today, lte: new Date(today.getTime() + 86400000) },
      },
    }),
    prisma.queueEntry.findMany({
      where: { queue: { branchId } },
      orderBy: { joinedAt: 'desc' },
      take: 6,
      include: {
        user: { select: { fullName: true } },
        queue: { select: { service: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    waitingEntries,
    servedToday,
    appointmentsToday,
    avgWaitTimeMinutes: waitingEntries > 0 ? waitingEntries * 15 : 10,
    recentEntries,
  };
};
