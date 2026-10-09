import prisma from '../config/prisma';
import { logAuditEvent } from '../utils/audit';

export interface CreateSkillInput {
  name: string;
  description?: string;
}

export const createSkill = async (
  organizationId: string,
  input: CreateSkillInput,
  createdByUserId?: string
) => {
  const cleanName = input.name.trim();
  if (!cleanName) {
    throw new Error('Skill name is required');
  }

  const existing = await prisma.skill.findUnique({
    where: {
      organizationId_name: {
        organizationId,
        name: cleanName,
      },
    },
  });

  if (existing) {
    throw new Error(`A skill named "${cleanName}" already exists in this organization`);
  }

  const skill = await prisma.skill.create({
    data: {
      organizationId,
      name: cleanName,
      description: input.description?.trim() || null,
    },
  });

  await logAuditEvent({
    organizationId,
    userId: createdByUserId,
    action: 'SKILL_CREATED',
    details: { skillId: skill.id, name: skill.name },
  });

  return skill;
};

export const getSkillsByOrganization = async (organizationId: string) => {
  return await prisma.skill.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { staffSkills: true, serviceRequirements: true },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const deleteSkill = async (
  skillId: string,
  organizationId: string,
  deletedByUserId?: string
) => {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
  });

  if (!skill) throw new Error('Skill not found');
  if (skill.organizationId !== organizationId) {
    throw new Error('Security Error: Skill does not belong to this organization');
  }

  await prisma.skill.delete({
    where: { id: skillId },
  });

  await logAuditEvent({
    organizationId,
    userId: deletedByUserId,
    action: 'SKILL_DELETED',
    details: { skillId, name: skill.name },
  });

  return { success: true };
};

export const assignSkillToStaff = async (
  staffUserId: string,
  skillId: string,
  assignedByUserId: string,
  organizationId: string
) => {
  // Validate staff exists and belongs to organization
  const staff = await prisma.user.findUnique({
    where: { id: staffUserId },
    include: { staffBranch: true },
  });

  if (!staff) throw new Error('Staff user not found');
  if (staff.organizationId && staff.organizationId !== organizationId) {
    throw new Error('Security Error: Staff user does not belong to this organization');
  }

  // Validate skill exists and belongs to organization
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
  });

  if (!skill) throw new Error('Skill not found');
  if (skill.organizationId !== organizationId) {
    throw new Error('Security Error: Skill does not belong to this organization');
  }

  const staffSkill = await prisma.staffSkill.upsert({
    where: {
      userId_skillId: {
        userId: staffUserId,
        skillId,
      },
    },
    create: {
      userId: staffUserId,
      skillId,
      assignedBy: assignedByUserId,
    },
    update: {
      assignedBy: assignedByUserId,
    },
    include: {
      skill: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await logAuditEvent({
    organizationId,
    branchId: staff.staffBranchId,
    userId: assignedByUserId,
    action: 'STAFF_SKILL_ASSIGNED',
    details: { staffUserId, skillId, skillName: skill.name },
  });

  return staffSkill;
};

export const removeSkillFromStaff = async (
  staffUserId: string,
  skillId: string,
  removedByUserId: string,
  organizationId: string
) => {
  const staffSkill = await prisma.staffSkill.findUnique({
    where: {
      userId_skillId: {
        userId: staffUserId,
        skillId,
      },
    },
    include: { skill: true, user: true },
  });

  if (!staffSkill) throw new Error('Staff skill assignment not found');
  if (staffSkill.skill.organizationId !== organizationId) {
    throw new Error('Security Error: Skill does not belong to this organization');
  }

  await prisma.staffSkill.delete({
    where: { id: staffSkill.id },
  });

  await logAuditEvent({
    organizationId,
    branchId: staffSkill.user.staffBranchId,
    userId: removedByUserId,
    action: 'STAFF_SKILL_REMOVED',
    details: { staffUserId, skillId, skillName: staffSkill.skill.name },
  });

  return { success: true };
};

export const getStaffSkills = async (staffUserId: string) => {
  return await prisma.staffSkill.findMany({
    where: { userId: staffUserId },
    include: { skill: true },
    orderBy: { assignedAt: 'desc' },
  });
};

export const setServiceSkillRequirements = async (
  serviceId: string,
  skillIds: string[],
  organizationId: string,
  updatedByUserId?: string
) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { branch: true },
  });

  if (!service) throw new Error('Service not found');
  if (service.branch.organizationId !== organizationId) {
    throw new Error('Security Error: Service does not belong to this organization');
  }

  // Validate all skills belong to the organization
  const skills = await prisma.skill.findMany({
    where: { id: { in: skillIds }, organizationId },
  });

  if (skills.length !== skillIds.length) {
    throw new Error('One or more selected skills do not belong to this organization');
  }

  // Transactionally replace skill requirements for this service
  return await prisma.$transaction(async (tx) => {
    await tx.serviceSkillRequirement.deleteMany({
      where: { serviceId },
    });

    if (skillIds.length > 0) {
      await tx.serviceSkillRequirement.createMany({
        data: skillIds.map((skillId) => ({
          serviceId,
          skillId,
          isRequired: true,
        })),
      });
    }

    const updated = await tx.serviceSkillRequirement.findMany({
      where: { serviceId },
      include: { skill: true },
    });

    await logAuditEvent({
      organizationId,
      branchId: service.branchId,
      userId: updatedByUserId,
      action: 'SERVICE_SKILL_REQUIREMENTS_UPDATED',
      details: {
        serviceId,
        serviceName: service.name,
        skillIds,
        skillNames: skills.map((s) => s.name),
      },
    });

    return updated;
  });
};

export const getServiceSkillRequirements = async (serviceId: string) => {
  return await prisma.serviceSkillRequirement.findMany({
    where: { serviceId },
    include: { skill: true },
  });
};
