import prisma from '../config/prisma';
import { EntryStatus, Role } from '@prisma/client';

export interface StaffCapabilityReport {
  branchId: string;
  branchName: string;
  serviceId: string;
  serviceName: string;
  requiredSkills: { id: string; name: string }[];
  totalBranchStaff: number;
  qualifiedStaff: Array<{
    id: string;
    fullName: string;
    email: string;
    skills: string[];
    isServing: boolean;
    currentTicketNumber?: string | null;
  }>;
  idleQualifiedStaff: Array<{
    id: string;
    fullName: string;
    email: string;
    skills: string[];
  }>;
  busyQualifiedStaff: Array<{
    id: string;
    fullName: string;
    email: string;
    skills: string[];
    currentTicketNumber?: string | null;
  }>;
  preferredStaffMember: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

/**
 * Predictable deterministic staff assignment evaluation foundation.
 * Determines qualified, busy, and idle staff members for a specific service.
 */
export const evaluateServiceStaffAssignment = async (
  serviceId: string
): Promise<StaffCapabilityReport> => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      branch: true,
      skillRequirements: {
        include: { skill: true },
      },
    },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  const branchId = service.branchId;
  const branchName = service.branch.name;
  const requiredSkillIds = service.skillRequirements.map((r) => r.skillId);
  const requiredSkills = service.skillRequirements.map((r) => ({
    id: r.skill.id,
    name: r.skill.name,
  }));

  // Fetch all staff members assigned to this branch
  const branchStaff = await prisma.user.findMany({
    where: {
      staffBranchId: branchId,
      role: { in: [Role.STAFF, Role.BRANCH_MANAGER] },
    },
    include: {
      staffSkills: {
        include: { skill: true },
      },
    },
  });

  // Find all active tickets currently being served or called in this branch
  const activeStaffTickets = await prisma.queueEntry.findMany({
    where: {
      queue: { branchId },
      status: { in: [EntryStatus.CALLING, EntryStatus.SERVING] },
      servedByStaffId: { not: null },
    },
    select: {
      servedByStaffId: true,
      ticketNumber: true,
      status: true,
    },
  });

  const servingStaffMap = new Map<string, string | null>();
  for (const ticket of activeStaffTickets) {
    if (ticket.servedByStaffId) {
      servingStaffMap.set(ticket.servedByStaffId, ticket.ticketNumber);
    }
  }

  const qualifiedStaff: StaffCapabilityReport['qualifiedStaff'] = [];
  const idleQualifiedStaff: StaffCapabilityReport['idleQualifiedStaff'] = [];
  const busyQualifiedStaff: StaffCapabilityReport['busyQualifiedStaff'] = [];

  for (const staff of branchStaff) {
    const staffSkillIds = new Set(staff.staffSkills.map((s) => s.skillId));
    const staffSkillNames = staff.staffSkills.map((s) => s.skill.name);

    // If service requires specific skills, staff must possess all required skills.
    // If service has no required skills, all branch staff are qualified.
    const hasAllRequiredSkills = requiredSkillIds.length === 0 || requiredSkillIds.every((reqId) => staffSkillIds.has(reqId));

    if (hasAllRequiredSkills) {
      const isServing = servingStaffMap.has(staff.id);
      const currentTicketNumber = servingStaffMap.get(staff.id) || null;

      const staffInfo = {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        skills: staffSkillNames,
        isServing,
        currentTicketNumber,
      };

      qualifiedStaff.push(staffInfo);

      if (isServing) {
        busyQualifiedStaff.push({
          id: staff.id,
          fullName: staff.fullName,
          email: staff.email,
          skills: staffSkillNames,
          currentTicketNumber,
        });
      } else {
        idleQualifiedStaff.push({
          id: staff.id,
          fullName: staff.fullName,
          email: staff.email,
          skills: staffSkillNames,
        });
      }
    }
  }

  // Deterministic preferred agent: Pick the first idle qualified agent
  const preferredStaffMember = idleQualifiedStaff.length > 0
    ? {
        id: idleQualifiedStaff[0].id,
        fullName: idleQualifiedStaff[0].fullName,
        email: idleQualifiedStaff[0].email,
      }
    : null;

  return {
    branchId,
    branchName,
    serviceId: service.id,
    serviceName: service.name,
    requiredSkills,
    totalBranchStaff: branchStaff.length,
    qualifiedStaff,
    idleQualifiedStaff,
    busyQualifiedStaff,
    preferredStaffMember,
  };
};

/**
 * Branch-level staff availability overview across all services
 */
export const getBranchStaffAvailability = async (branchId: string) => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      services: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
    },
  });

  if (!branch) throw new Error('Branch not found');

  const reports = await Promise.all(
    branch.services.map((svc) => evaluateServiceStaffAssignment(svc.id))
  );

  return {
    branchId,
    branchName: branch.name,
    services: reports,
  };
};
