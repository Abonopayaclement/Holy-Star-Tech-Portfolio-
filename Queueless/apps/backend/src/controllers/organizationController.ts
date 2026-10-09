import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import * as organizationService from '../services/organizationService';
import { canAccessOrganization, canAccessBranch } from '../utils/tenant';
import { logAuditEvent } from '../utils/audit';

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const org = await organizationService.createOrganization(req.body, userId);
    res.status(201).json(org);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const orgs = await organizationService.getAllOrganizations();
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPublicOrganizations = async (req: Request, res: Response) => {
  try {
    const orgs = await organizationService.getPublicOrganizations();
    res.json(orgs);
  } catch (error) {
    console.error('Error in getPublicOrganizations:', error);
    res.status(500).json({ error: 'Internal server error fetching organizations' });
  }
};

export const getOrganization = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot access this organization' });
    }

    const org = await organizationService.getOrganizationById(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient organization privileges' });
    }

    const org = await organizationService.updateOrganization(orgId, req.body, reqUser.id);
    res.json(org);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this organization' });
    }

    const branch = await organizationService.createBranch(orgId, req.body, reqUser.id);
    res.status(201).json(branch);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getBranch = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const branch = await organizationService.getBranchWithDetails(branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const reqUser = (req as any).user;

    const hasAccess = await canAccessBranch(reqUser, branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Cannot manage this branch' });
    }

    const branch = await organizationService.updateBranch(branchId, req.body, reqUser.id);
    res.json(branch);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const reqUser = (req as any).user;

    const hasAccess = await canAccessBranch(reqUser, branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Cannot create service for this branch' });
    }

    const service = await organizationService.createService(branchId, req.body, reqUser.id);
    res.status(201).json(service);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId as string;
    const reqUser = (req as any).user;

    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { branchId: true },
    });
    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const hasAccess = await canAccessBranch(reqUser, existingService.branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Cannot update this service' });
    }

    const service = await organizationService.updateService(serviceId, req.body, reqUser.id);
    res.json(service);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const assignStaff = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const { userId } = req.body;
    const reqUser = (req as any).user;

    const hasAccess = await canAccessBranch(reqUser, branchId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Cannot assign staff to this branch' });
    }

    const updatedUser = await organizationService.assignStaffToBranch(branchId, userId, reqUser.id);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getBranchAnalytics = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const analytics = await organizationService.getBranchAnalytics(branchId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrganizationAnalytics = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot view organization analytics' });
    }

    const analytics = await organizationService.getOrganizationAnalytics(orgId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerOrganizationPublic = async (req: Request, res: Response) => {
  try {
    const result = await organizationService.registerNewOrganization(req.body);
    res.status(201).json({
      message: 'Organization registration submitted successfully. Pending approval by the Super Admin.',
      ...result,
    });
  } catch (error: any) {
    console.error('Error in registerOrganizationPublic:', error);
    res.status(400).json({ error: error.message || 'Failed to register organization' });
  }
};

export const getPendingOrganizations = async (req: Request, res: Response) => {
  try {
    const pending = await organizationService.getPendingOrganizations();
    res.json(pending);
  } catch (error: any) {
    console.error('Error in getPendingOrganizations:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const approveOrganization = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const superAdminId = (req as any).user.id;
    const org = await organizationService.approveOrganization(orgId, superAdminId);
    res.json({ message: 'Organization approved successfully', organization: org });
  } catch (error: any) {
    console.error('Error in approveOrganization:', error);
    res.status(400).json({ error: error.message || 'Failed to approve organization' });
  }
};

export const rejectOrganization = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const superAdminId = (req as any).user.id;
    const { reason } = req.body;
    const org = await organizationService.rejectOrganization(orgId, superAdminId, reason);
    res.json({ message: 'Organization rejected', organization: org });
  } catch (error: any) {
    console.error('Error in rejectOrganization:', error);
    res.status(400).json({ error: error.message || 'Failed to reject organization' });
  }
};

export const getOrganizationDetails = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this organization' });
    }

    const orgOverview = await organizationService.getOrganizationDetailedOverview(orgId);
    if (!orgOverview) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(orgOverview);
  } catch (error: any) {
    console.error('Error in getOrganizationDetails:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createOrgStaff = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this organization' });
    }

    const { fullName, email, password, role, branchId, phoneNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, organizationId: orgId },
      });
      if (!branch) {
        return res.status(400).json({ error: 'Selected branch does not belong to this organization.' });
      }
    }

    const assignedRole = role === 'BRANCH_MANAGER' ? 'BRANCH_MANAGER' : 'STAFF';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newStaff = await prisma.user.create({
      data: {
        fullName: String(fullName).trim(),
        email: normalizedEmail,
        passwordHash,
        phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
        role: assignedRole,
        organizationId: orgId,
        staffBranchId: branchId || null,
        ...(assignedRole === 'BRANCH_MANAGER' && branchId
          ? { managedBranches: { connect: { id: branchId } } }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phoneNumber: true,
        staffBranchId: true,
        staffBranch: { select: { id: true, name: true, location: true } },
        createdAt: true,
      },
    });

    await logAuditEvent({
      organizationId: orgId,
      branchId: branchId || null,
      userId: reqUser.id,
      action: 'STAFF_CREATED',
      details: { staffId: newStaff.id, email: newStaff.email, role: assignedRole },
    });

    res.status(201).json(newStaff);
  } catch (error: any) {
    console.error('Error creating org staff:', error);
    res.status(400).json({ error: error.message || 'Failed to create staff member' });
  }
};

export const getOrgStaff = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this organization' });
    }

    const staff = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        role: { in: ['STAFF', 'BRANCH_MANAGER'] },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phoneNumber: true,
        staffBranchId: true,
        staffBranch: { select: { id: true, name: true, location: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(staff);
  } catch (error: any) {
    console.error('Error fetching org staff:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
