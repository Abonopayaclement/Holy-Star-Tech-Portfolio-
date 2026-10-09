import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { logAuditEvent } from '../utils/audit';
import { canAccessBranch } from '../utils/tenant';

/**
 * Public endpoint to resolve a QR code or deep-link token.
 * Supports:
 * - Dynamic QRCode database model (with expiration and revocation checks)
 * - Legacy Branch QR code (by branch qrCodeId or branchId)
 * - Legacy Service QR token (by serviceId)
 */
export const resolveQr = async (req: Request, res: Response) => {
  try {
    const rawParam = req.params.code;
    const rawCode = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    if (!rawCode) {
      return res.status(400).json({ error: 'QR code identifier is required' });
    }

    // Clean up code (strip URL prefix or custom scheme if passed directly)
    let token = String(rawCode).trim();
    if (token.includes('/join/')) {
      token = token.split('/join/').pop()?.split('?')[0] || token;
    } else if (token.startsWith('queueless://')) {
      token = token.replace('queueless://join/', '').replace('queueless://', '').split('?')[0];
    }

    // 1. First, check dynamic QRCode table
    const dynamicQr = await prisma.qRCode.findUnique({
      where: { token },
      include: {
        organization: { select: { id: true, name: true, type: true, logo: true } },
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
            operatingHours: true,
            qrCodeId: true,
            isActive: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            isActive: true,
            allowRemoteJoin: true,
            queues: {
              select: { id: true, status: true, closedReason: true },
            },
          },
        },
      },
    });

    if (dynamicQr) {
      // Check if branch is inactive
      if (!dynamicQr.branch.isActive) {
        return res.status(400).json({
          error: 'The branch associated with this QR code is currently inactive.',
          code: 'BRANCH_INACTIVE',
        });
      }

      // Check Revocation
      if (dynamicQr.status === 'REVOKED') {
        return res.status(400).json({
          error: 'This QR code has been closed by the organization. Please use the QueueLess app or scan a current QR code.',
          code: 'QR_REVOKED',
        });
      }

      // Check Expiration
      const isExpired = dynamicQr.status === 'EXPIRED' || (dynamicQr.expiresAt && new Date(dynamicQr.expiresAt) < new Date());
      if (isExpired) {
        if (dynamicQr.status !== 'EXPIRED') {
          await prisma.qRCode.update({
            where: { id: dynamicQr.id },
            data: { status: 'EXPIRED' },
          });
          await logAuditEvent({
            organizationId: dynamicQr.organizationId,
            branchId: dynamicQr.branchId,
            action: 'QR_EXPIRED',
            details: { qrId: dynamicQr.id, token: dynamicQr.token, serviceId: dynamicQr.serviceId },
          });
        }
        return res.status(400).json({
          error: 'This QueueLess QR code is no longer active and has expired. Please scan a current QR code or join manually from the QueueLess app.',
          code: 'QR_EXPIRED',
          expiresAt: dynamicQr.expiresAt,
        });
      }

      // Audit log scan event
      await logAuditEvent({
        organizationId: dynamicQr.organizationId,
        branchId: dynamicQr.branchId,
        action: 'QR_SCANNED',
        details: { qrId: dynamicQr.id, token: dynamicQr.token, serviceId: dynamicQr.serviceId },
      });

      // Resolved dynamic Service QR
      if (dynamicQr.type === 'SERVICE' && dynamicQr.service) {
        if (!dynamicQr.service.isActive) {
          return res.status(400).json({
            error: 'This service is currently inactive.',
            code: 'SERVICE_INACTIVE',
          });
        }
        const serviceQueue = dynamicQr.service.queues[0];
        const isQueueOpen = serviceQueue?.status === 'OPEN';
        return res.json({
          type: 'SERVICE',
          qrCode: {
            id: dynamicQr.id,
            token: dynamicQr.token,
            status: dynamicQr.status,
            expiresAt: dynamicQr.expiresAt,
          },
          organization: dynamicQr.organization,
          branch: dynamicQr.branch,
          service: {
            id: dynamicQr.service.id,
            name: dynamicQr.service.name,
            description: dynamicQr.service.description,
            duration: dynamicQr.service.duration,
            price: dynamicQr.service.price,
            allowRemoteJoin: dynamicQr.service.allowRemoteJoin,
            queueId: serviceQueue ? serviceQueue.id : null,
            isQueueOpen,
            closedReason: serviceQueue?.closedReason || null,
            queueClosedReason: serviceQueue?.closedReason || null,
          },
        });
      }

      // Resolved dynamic Branch QR
      const branchServices = await prisma.service.findMany({
        where: { branchId: dynamicQr.branchId, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
          allowRemoteJoin: true,
          queues: {
            select: { id: true, status: true, closedReason: true },
          },
        },
      });

      return res.json({
        type: 'BRANCH',
        qrCode: {
          id: dynamicQr.id,
          token: dynamicQr.token,
          status: dynamicQr.status,
          expiresAt: dynamicQr.expiresAt,
        },
        organization: dynamicQr.organization,
        branch: {
          ...dynamicQr.branch,
          services: branchServices,
        },
      });
    }

    // 2. Fallback: Check if token matches a Branch (by static qrCodeId or id)
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { qrCodeId: token },
          { id: token },
        ],
        isActive: true,
      },
      include: {
        organization: { select: { id: true, name: true, type: true, logo: true } },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            allowRemoteJoin: true,
            queues: {
              select: { id: true, status: true, closedReason: true },
            },
          },
        },
      },
    });

    if (branch) {
      return res.json({
        type: 'BRANCH',
        organization: branch.organization,
        branch: {
          id: branch.id,
          name: branch.name,
          location: branch.location,
          operatingHours: branch.operatingHours,
          qrCodeId: branch.qrCodeId,
          services: branch.services,
        },
      });
    }

    // 3. Fallback: Check if token matches a Service (by id)
    const service = await prisma.service.findFirst({
      where: {
        id: token,
        isActive: true,
      },
      include: {
        branch: {
          include: {
            organization: { select: { id: true, name: true, type: true, logo: true } },
          },
        },
        queues: {
          select: { id: true, status: true, closedReason: true },
        },
      },
    });

    if (service) {
      const sQueue = service.queues[0];
      const isQueueOpen = sQueue?.status === 'OPEN';
      return res.json({
        type: 'SERVICE',
        organization: service.branch.organization,
        branch: {
          id: service.branch.id,
          name: service.branch.name,
          location: service.branch.location,
          operatingHours: service.branch.operatingHours,
        },
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          allowRemoteJoin: service.allowRemoteJoin,
          queueId: sQueue ? sQueue.id : null,
          isQueueOpen,
          closedReason: sQueue?.closedReason || null,
          queueClosedReason: sQueue?.closedReason || null,
        },
      });
    }

    return res.status(404).json({
      error: 'Invalid or expired QR code. No active branch or service matches this code.',
      code: 'QR_NOT_FOUND',
    });
  } catch (error: any) {
    console.error('Error in resolveQr:', error);
    res.status(500).json({ error: 'Internal server error resolving QR code' });
  }
};

/**
 * Generate a new QR code with configurable expiration for a branch or service.
 * Supports validity periods: '1_HOUR', '6_HOURS', '24_HOURS', '3_DAYS', '7_DAYS', 'CUSTOM'.
 */
export const generateBranchQr = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const reqUser = (req as any).user;

    const hasAccess = await canAccessBranch(reqUser, branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this branch' });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { organization: { select: { id: true, name: true } } },
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const { serviceId, validity = '24_HOURS', customExpiresAt } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: 'serviceId is required. QR codes must belong to a specific service.' });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, branchId: branch.id, isActive: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'Selected service does not exist or does not belong to this branch.' });
    }

    // Calculate expiration
    let expiresAt: Date | null = null;
    const now = Date.now();
    switch (validity) {
      case '1_HOUR':
        expiresAt = new Date(now + 1 * 60 * 60 * 1000);
        break;
      case '6_HOURS':
        expiresAt = new Date(now + 6 * 60 * 60 * 1000);
        break;
      case '12_HOURS':
        expiresAt = new Date(now + 12 * 60 * 60 * 1000);
        break;
      case '24_HOURS':
        expiresAt = new Date(now + 24 * 60 * 60 * 1000);
        break;
      case '3_DAYS':
        expiresAt = new Date(now + 3 * 24 * 60 * 60 * 1000);
        break;
      case '7_DAYS':
        expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'CUSTOM':
        if (customExpiresAt) {
          expiresAt = new Date(customExpiresAt);
        }
        break;
    }

    // Generate secure random alphanumeric token including branch & service prefix
    const randSuffix = crypto.randomBytes(5).toString('hex').toUpperCase();
    const branchPrefix = branch.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'QL';
    const svcPrefix = service.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'SVC';
    const token = `QR-${branchPrefix}-${svcPrefix}-${randSuffix}`;

    const creatorLabel = reqUser?.fullName
      ? `${reqUser.fullName} (${reqUser.email || reqUser.role})`
      : reqUser?.email || reqUser?.id || 'Staff';

    const qrRecord = await prisma.qRCode.create({
      data: {
        organizationId: branch.organizationId,
        branchId: branch.id,
        serviceId: service.id,
        token,
        type: 'SERVICE',
        status: 'ACTIVE',
        expiresAt,
        createdBy: creatorLabel,
      },
      include: {
        service: { select: { id: true, name: true, duration: true } },
        branch: { select: { id: true, name: true, location: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    // Automatically open the corresponding Service Queue so customers can join remotely and via QR
    await prisma.queue.updateMany({
      where: { branchId: branch.id, serviceId: service.id },
      data: { status: 'OPEN' },
    });

    await logAuditEvent({
      organizationId: branch.organizationId,
      branchId: branch.id,
      userId: reqUser?.id,
      action: 'QR_CREATED',
      details: {
        qrId: qrRecord.id,
        token: qrRecord.token,
        type: qrRecord.type,
        serviceId: qrRecord.serviceId,
        serviceName: service.name,
        expiresAt: qrRecord.expiresAt,
        createdBy: creatorLabel,
      },
    });

    const baseUrl = process.env.PUBLIC_APP_URL || 'https://queueless.app';
    const webUrl = `${baseUrl}/join/${qrRecord.token}`;
    const deepLink = `queueless://join/${qrRecord.token}`;

    res.status(201).json({
      message: 'QR code generated successfully',
      qr: qrRecord,
      webUrl,
      deepLink,
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: error.message || 'Failed to generate QR code' });
  }
};

/**
 * Get real aggregate QR statistics for a branch
 */
export const getBranchQrStats = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const reqUser = (req as any).user;

    const hasAccess = await canAccessBranch(reqUser, branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this branch' });
    }

    const now = new Date();

    // 1. Fetch all QR codes for this branch
    const allQrs = await prisma.qRCode.findMany({
      where: { branchId },
      include: {
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check & update any expired active QRs dynamically
    const qrs = await Promise.all(
      allQrs.map(async (qr) => {
        if (qr.status === 'ACTIVE' && qr.expiresAt && new Date(qr.expiresAt) < now) {
          await prisma.qRCode.update({
            where: { id: qr.id },
            data: { status: 'EXPIRED' },
          });
          return { ...qr, status: 'EXPIRED' as const };
        }
        return qr;
      })
    );

    // 2. Aggregate summary counts
    const totalQrCodes = qrs.length;
    const activeQrCodes = qrs.filter((q) => q.status === 'ACTIVE').length;
    const expiredQrCodes = qrs.filter((q) => q.status === 'EXPIRED').length;
    const revokedQrCodes = qrs.filter((q) => q.status === 'REVOKED').length;

    // 3. Fetch active services belonging to this branch with their queue status
    const branchServices = await prisma.service.findMany({
      where: { branchId, isActive: true },
      select: {
        id: true,
        name: true,
        duration: true,
        queues: {
          select: { id: true, status: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    // 4. Compute service-level breakdown table: | Service | Queue Status | Active QR | Total QR |
    const serviceBreakdown = branchServices.map((svc) => {
      const svsQrs = qrs.filter((q) => q.serviceId === svc.id);
      const activeCount = svsQrs.filter((q) => q.status === 'ACTIVE').length;
      const queue = svc.queues?.[0];
      return {
        serviceId: svc.id,
        serviceName: svc.name,
        duration: svc.duration,
        queueId: queue?.id || null,
        queueStatus: (queue?.status || 'CLOSED') as 'OPEN' | 'CLOSED',
        activeQrCount: activeCount,
        totalQrCount: svsQrs.length,
        hasActiveQr: activeCount > 0,
        activeQr: svsQrs.find((q) => q.status === 'ACTIVE') || null,
      };
    });

    // 5. Recent activity log
    const recentActivity = qrs.slice(0, 10).map((q) => ({
      id: q.id,
      token: q.token,
      serviceName: q.service?.name || 'Service',
      status: q.status,
      createdAt: q.createdAt,
      expiresAt: q.expiresAt,
      revokedAt: q.revokedAt,
      createdBy: q.createdBy,
      revokedBy: q.revokedBy,
    }));

    res.json({
      totalQrCodes,
      activeQrCodes,
      expiredQrCodes,
      revokedQrCodes,
      serviceBreakdown,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Error fetching QR stats:', error);
    res.status(500).json({ error: 'Internal server error calculating QR statistics' });
  }
};

/**
 * Get all QR codes for a branch (active, expired, and revoked)
 */
export const getBranchQrList = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const reqUser = (req as any).user;

    const hasAccess = await canAccessBranch(reqUser, branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this branch' });
    }

    const qrList = await prisma.qRCode.findMany({
      where: { branchId },
      include: {
        service: { select: { id: true, name: true, duration: true } },
        branch: { select: { id: true, name: true, location: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check expiration on read and mark if passed
    const now = new Date();
    const updatedList = await Promise.all(
      qrList.map(async (qr) => {
        if (qr.status === 'ACTIVE' && qr.expiresAt && new Date(qr.expiresAt) < now) {
          await prisma.qRCode.update({
            where: { id: qr.id },
            data: { status: 'EXPIRED' },
          });
          return { ...qr, status: 'EXPIRED' as const };
        }
        return qr;
      })
    );

    res.json(updatedList);
  } catch (error: any) {
    console.error('Error in getBranchQrList:', error);
    res.status(500).json({ error: 'Internal server error fetching QR codes' });
  }
};

/**
 * Revoke an active QR code
 */
export const revokeQr = async (req: Request, res: Response) => {
  try {
    const qrId = req.params.qrId as string;
    const reqUser = (req as any).user;

    const qr = await prisma.qRCode.findUnique({
      where: { id: qrId },
    });

    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const hasAccess = await canAccessBranch(reqUser, qr.branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to revoke this QR code' });
    }

    const revokerLabel = reqUser?.fullName
      ? `${reqUser.fullName} (${reqUser.email || reqUser.role})`
      : reqUser?.email || reqUser?.id || 'Staff';

    const { closeQueue = false } = req.body || {};

    const updated = await prisma.qRCode.update({
      where: { id: qrId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: revokerLabel,
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    });

    if (closeQueue && qr.serviceId) {
      await prisma.queue.updateMany({
        where: { branchId: qr.branchId, serviceId: qr.serviceId },
        data: { status: 'CLOSED' },
      });
    }

    await logAuditEvent({
      organizationId: qr.organizationId,
      branchId: qr.branchId,
      userId: reqUser?.id,
      action: 'QR_REVOKED',
      details: {
        qrId: qr.id,
        token: qr.token,
        serviceId: qr.serviceId,
        closeQueue,
        revokedBy: revokerLabel,
      },
    });

    res.json({
      message: 'QR code revoked successfully',
      qr: updated,
    });
  } catch (error: any) {
    console.error('Error revoking QR code:', error);
    res.status(500).json({ error: 'Internal server error revoking QR code' });
  }
};

/**
 * Manager/Admin endpoint to fetch legacy QR payloads for a branch and its services
 */
export const getBranchQRs = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        organization: { select: { id: true, name: true } },
        services: {
          where: { isActive: true },
          select: { id: true, name: true, duration: true },
        },
      },
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const baseUrl = process.env.PUBLIC_APP_URL || 'https://queueless.app';
    const branchQrPayload = `${baseUrl}/join/${branch.qrCodeId}`;
    const branchDeepLink = `queueless://join/${branch.qrCodeId}`;

    const serviceQRs = branch.services.map((svc) => ({
      serviceId: svc.id,
      serviceName: svc.name,
      qrPayload: `${baseUrl}/join/${svc.id}`,
      deepLink: `queueless://join/${svc.id}`,
    }));

    res.json({
      branch: {
        id: branch.id,
        name: branch.name,
        organizationName: branch.organization.name,
        qrCodeId: branch.qrCodeId,
        qrPayload: branchQrPayload,
        deepLink: branchDeepLink,
      },
      services: serviceQRs,
    });
  } catch (error) {
    console.error('Error in getBranchQRs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete an expired or revoked QR code
 */
export const deleteQr = async (req: Request, res: Response) => {
  try {
    const qrId = req.params.qrId as string;
    const reqUser = (req as any).user;

    const qr = await prisma.qRCode.findUnique({
      where: { id: qrId },
    });

    if (!qr) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const hasAccess = await canAccessBranch(reqUser, qr.branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to delete this QR code' });
    }

    await prisma.qRCode.delete({
      where: { id: qrId },
    });

    await logAuditEvent({
      organizationId: qr.organizationId,
      branchId: qr.branchId,
      userId: reqUser?.id,
      action: 'QR_DELETED',
      details: {
        qrId: qr.id,
        token: qr.token,
        serviceId: qr.serviceId,
      },
    });

    res.json({
      message: 'QR code deleted successfully',
      id: qrId,
    });
  } catch (error: any) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({ error: 'Internal server error deleting QR code' });
  }
};

