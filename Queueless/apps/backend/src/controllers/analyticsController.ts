import { Request, Response } from 'express';
import prisma from '../config/prisma';
import * as analyticsService from '../services/analyticsService';
import { canAccessOrganization, canAccessBranch } from '../utils/tenant';
import { AnalyticsFilterParams, Role } from '@queueless/types';

/**
 * Validates RBAC and Tenant/Branch authorization for analytics requests.
 * Returns { authorized: boolean, errorStatus?: number, errorMessage?: string, effectiveFilter?: AnalyticsFilterParams }
 */
export const authorizeAnalyticsRequest = async (
  reqUser: any,
  query: any
): Promise<{
  authorized: boolean;
  errorStatus?: number;
  errorMessage?: string;
  filter?: AnalyticsFilterParams;
}> => {
  if (!reqUser) {
    return { authorized: false, errorStatus: 401, errorMessage: 'Unauthorized: Authentication required' };
  }

  // Customers are strictly forbidden from enterprise analytics
  if (reqUser.role === Role.CUSTOMER) {
    return { authorized: false, errorStatus: 403, errorMessage: 'Forbidden: Customers cannot access enterprise operational analytics' };
  }

  const requestedOrgId = (query.organizationId as string) || reqUser.organizationId;
  const requestedBranchId = query.branchId as string;
  const requestedServiceId = query.serviceId as string;

  // 1. Super Admin has unrestricted access
  if (reqUser.role === Role.SUPER_ADMIN) {
    const superAdminOrgId =
      query.organizationId === 'all' || !query.organizationId || query.organizationId === ''
        ? undefined
        : (query.organizationId as string);

    return {
      authorized: true,
      filter: {
        organizationId: superAdminOrgId,
        branchId: requestedBranchId || undefined,
        serviceId: requestedServiceId || undefined,
        dateRange: query.dateRange,
        startDate: query.startDate,
        endDate: query.endDate,
        timezone: query.timezone,
        channel: query.channel,
        priority: query.priority,
        status: query.status,
      },
    };
  }

  // 2. Org Admin can only access their own organization
  if (reqUser.role === Role.ORG_ADMIN) {
    if (requestedOrgId && requestedOrgId !== reqUser.organizationId) {
      return { authorized: false, errorStatus: 403, errorMessage: 'Forbidden: Cannot access another organization\'s analytics' };
    }

    if (requestedBranchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: requestedBranchId },
        select: { organizationId: true },
      });
      if (!branch || branch.organizationId !== reqUser.organizationId) {
        return { authorized: false, errorStatus: 403, errorMessage: 'Forbidden: Branch does not belong to your organization' };
      }
    }

    return {
      authorized: true,
      filter: {
        organizationId: reqUser.organizationId,
        branchId: requestedBranchId,
        serviceId: requestedServiceId,
        dateRange: query.dateRange,
        startDate: query.startDate,
        endDate: query.endDate,
        timezone: query.timezone,
        channel: query.channel,
        priority: query.priority,
        status: query.status,
      },
    };
  }

  // 3. Branch Manager can only access their managed branch(es)
  if (reqUser.role === Role.BRANCH_MANAGER) {
    const userManagedBranches = await prisma.branch.findMany({
      where: { managers: { some: { id: reqUser.id } } },
      select: { id: true, organizationId: true },
    });
    const managedBranchIds = userManagedBranches.map((b) => b.id);

    const targetBranchId = requestedBranchId || managedBranchIds[0];
    if (!targetBranchId || !managedBranchIds.includes(targetBranchId)) {
      return { authorized: false, errorStatus: 403, errorMessage: 'Forbidden: You are not authorized to view analytics for this branch' };
    }

    return {
      authorized: true,
      filter: {
        organizationId: reqUser.organizationId,
        branchId: targetBranchId,
        serviceId: requestedServiceId,
        dateRange: query.dateRange,
        startDate: query.startDate,
        endDate: query.endDate,
        timezone: query.timezone,
        channel: query.channel,
        priority: query.priority,
        status: query.status,
      },
    };
  }

  // 4. Staff Agent can only access their assigned branch
  if (reqUser.role === Role.STAFF) {
    const targetBranchId = reqUser.staffBranchId || requestedBranchId;
    if (reqUser.staffBranchId && requestedBranchId && requestedBranchId !== reqUser.staffBranchId) {
      return { authorized: false, errorStatus: 403, errorMessage: 'Forbidden: Staff can only access operational analytics for their assigned branch' };
    }

    return {
      authorized: true,
      filter: {
        organizationId: reqUser.organizationId,
        branchId: targetBranchId,
        serviceId: requestedServiceId,
        dateRange: query.dateRange,
        startDate: query.startDate,
        endDate: query.endDate,
        timezone: query.timezone,
        channel: query.channel,
        priority: query.priority,
        status: query.status,
      },
    };
  }

  return { authorized: false, errorStatus: 403, errorMessage: 'Forbidden: Role not authorized' };
};

/**
 * GET /api/analytics/dashboard
 * Aggregated comprehensive analytics across all modules
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const data = await analyticsService.getComprehensiveDashboard(auth.filter, reqUser);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/realtime
 * Live operations snapshot (waiting, serving, counters, current wait)
 */
export const getRealTimeAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const data = await analyticsService.getRealTimeOperationsSnapshot(auth.filter);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/queue
 * Queue lifecycle metrics (waits, services, rates, percentiles)
 */
export const getQueueAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getQueueLifecycleMetrics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching queue analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/demand
 * Hourly and day of week demand distributions
 */
export const getDemandAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const [hourlyDemand, dayOfWeek] = await Promise.all([
      analyticsService.getHourlyDemandMetrics(auth.filter, dateRange),
      analyticsService.getDayOfWeekMetrics(auth.filter, dateRange),
    ]);
    res.json({ hourlyDemand, dayOfWeek });
  } catch (error: any) {
    console.error('Error fetching demand analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/services
 * Service performance comparisons
 */
export const getServiceAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getServicePerformanceMetrics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching service analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/branches
 * Multi-branch performance comparison (Org Admin / Super Admin only)
 */
export const getBranchAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    if (reqUser.role !== Role.ORG_ADMIN && reqUser.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Forbidden: Only organization administrators can view multi-branch comparative analytics' });
    }

    const orgId = auth.filter.organizationId || reqUser.organizationId;
    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getBranchPerformanceMetrics(orgId, auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching branch analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/organizations
 * Multi-tenant organization performance comparison (Super Admin only)
 */
export const getOrganizationPerformance = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Forbidden: Only Super Admin can view multi-tenant organization comparisons' });
    }
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getOrganizationPerformanceMetrics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching organization performance analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/queues
 * System-wide queue status and operational health (Super Admin & Org Admin)
 */
export const getQueuesAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role === Role.STAFF) {
      return res.status(403).json({ error: 'Forbidden: Staff cannot access system-wide queue inventory' });
    }
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const data = await analyticsService.getSystemQueues(auth.filter);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching queues analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/users
 * Administrative and staff user intelligence across the platform (Super Admin & Org Admin)
 */
export const getUsersAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role === Role.STAFF) {
      return res.status(403).json({ error: 'Forbidden: Staff cannot access administrative user analytics' });
    }
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getPlatformUsers(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching users analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/channels
 * Channel usage distribution
 */
export const getChannelAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getChannelMetrics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching channel analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/transfers
 * Service transfer patterns and rates
 */
export const getTransferAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role === Role.STAFF) {
      return res.status(403).json({ error: 'Forbidden: Staff cannot view organizational transfer matrices' });
    }
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getTransferMetrics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching transfer analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/congestion
 * Queue congestion score, utilization, thresholds
 */
export const getCongestionAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const data = await analyticsService.getQueueCongestionMetrics(auth.filter);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching congestion analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/appointments
 * Appointment lifecycle and rejection metrics
 */
export const getAppointmentAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getAppointmentAnalytics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching appointment analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/communication
 * Notification delivery, callback acknowledgement, and messaging metrics
 */
export const getCommunicationAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role === Role.STAFF) {
      return res.status(403).json({ error: 'Forbidden: Staff cannot view communication delivery metrics' });
    }
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getCommunicationAnalytics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching communication analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/staff
 * Staff operational metrics (factual, non-ranking, with sample sizes)
 */
export const getStaffAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role === Role.STAFF) {
      return res.status(403).json({ error: 'Forbidden: Staff cannot view colleague performance evaluations' });
    }
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getStaffPerformanceMetrics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching staff analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/counters
 * Counter activity and utilization
 */
export const getCounterAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const dateRange = analyticsService.resolveDateRange(
      auth.filter.dateRange,
      auth.filter.startDate,
      auth.filter.endDate,
      auth.filter.timezone
    );
    const data = await analyticsService.getCounterAnalytics(auth.filter, dateRange);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching counter analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/export/csv
 * Tenant-safe CSV download
 */
export const exportAnalyticsCsv = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role === Role.STAFF) {
      return res.status(403).json({ error: 'Forbidden: Staff cannot export raw operational data' });
    }
    const auth = await authorizeAnalyticsRequest(reqUser, req.query);
    if (!auth.authorized || !auth.filter) {
      return res.status(auth.errorStatus || 403).json({ error: auth.errorMessage });
    }

    const csvContent = await analyticsService.exportAnalyticsToCsv(auth.filter);
    const filename = `queueless-analytics-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('Error exporting analytics CSV:', error);
    res.status(500).json({ error: error.message || 'Internal server error during CSV export' });
  }
};

/**
 * GET /api/analytics/executive
 * Super Admin Executive Console platform-wide metrics and trend analytics
 */
export const getExecutiveAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Forbidden: Only Super Administrators can access the Executive Console' });
    }

    const period = (req.query.period as string) || 'last_7_days';
    const data = await analyticsService.getExecutiveConsoleAnalytics(period);
    res.json(data);
  } catch (error: any) {
    console.error('Error in getExecutiveAnalytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/analytics/queue-oversight
 * Super Admin read-only queue monitoring and inspection
 */
export const getQueueOversightAnalytics = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Forbidden: Only Super Administrators can access Queue Oversight' });
    }

    const filter = {
      organizationId: req.query.organizationId as string,
      branchId: req.query.branchId as string,
      serviceId: req.query.serviceId as string,
      status: req.query.status as string,
      dateRange: req.query.dateRange as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const data = await analyticsService.getQueueOversight(filter);
    res.json(data);
  } catch (error: any) {
    console.error('Error in getQueueOversightAnalytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
