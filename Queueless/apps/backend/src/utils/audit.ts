import prisma from '../config/prisma';

export interface CreateAuditLogParams {
  organizationId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  action: string;
  details?: Record<string, any> | string | null;
}

export const logAuditEvent = async (params: CreateAuditLogParams) => {
  try {
    const detailsString = typeof params.details === 'object' && params.details !== null
      ? JSON.stringify(params.details)
      : params.details || null;

    return await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId || null,
        branchId: params.branchId || null,
        userId: params.userId || null,
        action: params.action,
        details: detailsString,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Audit logging should not crash the main transaction
    return null;
  }
};
