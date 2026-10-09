import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const STAFF_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'];

// All analytics routes require authenticated staff/admin credentials
router.use(authenticate);
router.use(authorize(STAFF_ROLES));

// 0. Super Admin Executive Platform Console
router.get('/executive', authorize(['SUPER_ADMIN']), analyticsController.getExecutiveAnalytics);

// 0b. Super Admin Queue Oversight (Read-Only)
router.get('/queue-oversight', authorize(['SUPER_ADMIN']), analyticsController.getQueueOversightAnalytics);

// 1. Comprehensive Dashboard Aggregator
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// 2. Real-Time Operations Snapshot
router.get('/realtime', analyticsController.getRealTimeAnalytics);

// 3. Queue Lifecycle Metrics (Waits, Services, Rates, Percentiles)
router.get('/queue', analyticsController.getQueueAnalytics);

// 4. Demand Distributions (Hourly Peak & Day-of-Week)
router.get('/demand', analyticsController.getDemandAnalytics);

// 5. Service Performance Comparisons
router.get('/services', analyticsController.getServiceAnalytics);

// 6. Branch Performance Comparisons (Org Admin / Super Admin only)
router.get('/branches', analyticsController.getBranchAnalytics);

// 6b. Multi-Tenant Organization Comparisons (Super Admin only)
router.get('/organizations', analyticsController.getOrganizationPerformance);

// 6c. System-Wide Queue Status & Operational Health
router.get('/queues', analyticsController.getQueuesAnalytics);

// 6d. Platform Administrative & Staff User Intelligence
router.get('/users', analyticsController.getUsersAnalytics);

// 7. Channel Usage Breakdown (Remote, QR, Walk-In, Kiosk, Appointment)
router.get('/channels', analyticsController.getChannelAnalytics);

// 8. Service Transfer Analytics (Flow Patterns & Durations)
router.get('/transfers', analyticsController.getTransferAnalytics);

// 9. Queue Congestion Status & Thresholds
router.get('/congestion', analyticsController.getCongestionAnalytics);

// 10. Appointment Lifecycle & Rejection Analytics
router.get('/appointments', analyticsController.getAppointmentAnalytics);

// 11. Communication, Delivery & Callback Analytics
router.get('/communication', analyticsController.getCommunicationAnalytics);

// 12. Staff Operational Performance (Factual & Objective)
router.get('/staff', analyticsController.getStaffAnalytics);

// 13. Counter Utilization Analytics
router.get('/counters', analyticsController.getCounterAnalytics);

// 14. Data Export (CSV)
router.get('/export/csv', analyticsController.exportAnalyticsCsv);

export default router;
