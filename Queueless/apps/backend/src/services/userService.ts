import prisma from '../config/prisma';

export const createUser = async (data: any) => {
  return prisma.user.create({
    data,
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      managedBranches: true,
      staffBranch: true,
      organization: {
        include: {
          branches: {
            where: { isActive: true },
          },
        },
      },
    },
  });
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      managedBranches: true,
      staffBranch: true,
      organization: {
        include: {
          branches: {
            where: { isActive: true },
          },
        },
      },
    },
  });
};

export const getUserByFirebaseUid = async (firebaseUid: string) => {
  return prisma.user.findUnique({
    where: { firebaseUid },
    include: {
      managedBranches: true,
      staffBranch: true,
    },
  });
};

export const updateUser = async (id: string, data: any) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const getAllUsers = async () => {
  return prisma.user.findMany();
};

export const getStaffByOrganization = async (organizationId: string) => {
  return prisma.user.findMany({
    where: {
      organizationId,
      role: { in: ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN'] as any },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      phoneNumber: true,
      staffBranchId: true,
      staffBranch: { select: { id: true, name: true } },
    },
  });
};

