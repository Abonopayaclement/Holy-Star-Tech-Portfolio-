import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import * as categoryController from '../controllers/appointmentCategoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const STAFF_OPERATIONAL_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN'];
const CATEGORY_MANAGEMENT_ROLES = ['BRANCH_MANAGER', 'ORG_ADMIN'];

// Platform Oversight for Super Admin (Read-Only)
router.get('/platform-overview', authenticate, authorize(['SUPER_ADMIN']), appointmentController.getPlatformAppointments);

// Category routes
router.get('/categories', categoryController.getActiveCategories);
router.get('/categories/manage', authenticate, authorize(STAFF_OPERATIONAL_ROLES), categoryController.getCategoriesForStaff);
router.post('/categories', authenticate, authorize(CATEGORY_MANAGEMENT_ROLES), categoryController.createCategory);
router.put('/categories/:id', authenticate, authorize(CATEGORY_MANAGEMENT_ROLES), categoryController.updateCategory);
router.patch('/categories/:id/toggle', authenticate, authorize(CATEGORY_MANAGEMENT_ROLES), categoryController.toggleCategoryActive);
router.delete('/categories/:id', authenticate, authorize(CATEGORY_MANAGEMENT_ROLES), categoryController.deleteCategory);

// Customer routes
router.post('/', authenticate, appointmentController.createAppointment);
router.post('/request', authenticate, appointmentController.createRemoteRequest);
router.get('/my', authenticate, appointmentController.getUserAppointments);
router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/:appointmentId/details', authenticate, appointmentController.getAppointmentDetails);
router.post('/:appointmentId/pay', authenticate, appointmentController.payAppointment);
router.post('/:appointmentId/feedback', authenticate, appointmentController.submitFeedback);
router.post('/:appointmentId/follow-up', authenticate, appointmentController.requestFollowUp);
router.patch('/:appointmentId/hide', authenticate, appointmentController.hideAppointment);
router.post('/:appointmentId/cancel', authenticate, appointmentController.cancelAppointment);
router.post('/:appointmentId/reschedule', authenticate, appointmentController.rescheduleAppointment);

// Staff / Branch operational routes (Super Admin excluded from operating appointments)
router.get('/branch/:branchId', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.getBranchAppointments);
router.get('/branch/:branchId/requests', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.getBranchRemoteRequests);
router.patch('/:appointmentId/status', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.updateStatus);
router.post('/:appointmentId/approve', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.approveAppointment);
router.post('/:appointmentId/reject', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.rejectAppointment);
router.post('/:appointmentId/start', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.startAppointment);
router.post('/:appointmentId/complete', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.completeAppointment);
router.post('/:appointmentId/staff-follow-up', authenticate, authorize(STAFF_OPERATIONAL_ROLES), appointmentController.staffFollowUpAction);

export default router;

