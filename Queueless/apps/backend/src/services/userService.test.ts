import prisma from '../config/prisma';
import * as userService from './userService';

jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('userService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user', async () => {
    const userData = { email: 'test@example.com', fullName: 'Test User', firebaseUid: 'uid123' };
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1', ...userData });

    const result = await userService.createUser(userData);
    expect(result.email).toBe('test@example.com');
    expect(prisma.user.create).toHaveBeenCalledWith({ data: userData });
  });

  it('should get a user by firebaseUid', async () => {
    const firebaseUid = 'uid123';
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', firebaseUid });

    const result = await userService.getUserByFirebaseUid(firebaseUid);
    expect(result?.firebaseUid).toBe(firebaseUid);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseUid },
      include: {
        managedBranches: true,
        staffBranch: true,
      },
    });
  });
});
