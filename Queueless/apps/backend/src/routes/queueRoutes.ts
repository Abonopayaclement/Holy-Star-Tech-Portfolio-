import { Router } from 'express';
import * as queueController from '../controllers/queueController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Operational branch queue controls are strictly restricted to branch staff and managers.
// Super Admin is platform oversight and must NOT operate branch queues.
const OPERATIONAL_STAFF_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN'];
const BRANCH_MANAGEMENT_ROLES = ['BRANCH_MANAGER', 'ORG_ADMIN'];

// Public / Customer queries
router.get('/:queueId/status', queueController.getStatus);
router.get('/ticket/:entryId', queueController.getTicket);
router.get('/my-active', authenticate, queueController.getMyActiveTicket);
router.get('/my-history', authenticate, queueController.getMyQueueHistory);

// Customer queue action
router.post('/join', authenticate, queueController.joinQueue);
router.post('/entry/:entryId/cancel', authenticate, queueController.cancelEntry);
router.patch('/entry/:entryId/hide', authenticate, queueController.hideQueueEntry);
router.patch('/entry/:entryId/preference', authenticate, queueController.updateNotificationPreference);

// Staff queue actions (Strictly Branch Staff & Managers - SUPER_ADMIN Forbidden)
router.patch('/:queueId/status', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.updateStatus);
router.post('/walk-in', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.createWalkInTicket);
router.post('/:queueId/next', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.callNext);
router.post('/entry/:entryId/start', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.startServing);
router.post('/entry/:entryId/complete', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.completeEntry);
router.post('/entry/:entryId/skip', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.skipEntry);
router.post('/entry/:entryId/recall', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.recallSkippedEntry);

// Advanced Queue Operations (Transfer, Priority, Policies & Staff Assignment)
router.post('/entry/:entryId/transfer', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.transferTicket);
router.patch('/entry/:entryId/priority', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.updateTicketPriority);
router.get('/:queueId/policy', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.getQueuePolicy);
router.patch('/:queueId/policy', authenticate, authorize(BRANCH_MANAGEMENT_ROLES), queueController.updateQueuePolicy);
router.get('/branch/:branchId/staff-availability', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.getBranchStaffAvailability);
router.get('/service/:serviceId/staff-assignment', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.getServiceStaffAssignment);

// Phase 3 Physical Ticketing & Reprint
router.get('/entries/:entryId/ticket', queueController.getPrintableTicket);
router.post('/entries/:entryId/reprint', authenticate, authorize(OPERATIONAL_STAFF_ROLES), queueController.reprintTicket);

export default router;
