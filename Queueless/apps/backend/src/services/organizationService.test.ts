import prisma from '../config/prisma';
import * as organizationService from './organizationService';

jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    branch: {
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe('organizationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update a branch', async () => {
    const branchId = 'b1';
    const data = { name: 'Updated Branch' };
    (prisma.branch.update as jest.Mock).mockResolvedValue({ id: branchId, ...data });

    const result = await organizationService.updateBranch(branchId, data);
    expect(result.name).toBe('Updated Branch');
    expect(prisma.branch.update).toHaveBeenCalledWith({
      where: { id: branchId },
      data,
    });
  });
});
