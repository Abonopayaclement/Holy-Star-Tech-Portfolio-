import { Router } from 'express';
import * as organizationController from '../controllers/organizationController';
import * as qrController from '../controllers/qrController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const SUPER_ADMIN_ONLY = ['SUPER_ADMIN'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN'];
const ORG_AND_BRANCH_MANAGERS = ['ORG_ADMIN', 'BRANCH_MANAGER'];
const STAFF_OPERATIONAL = ['ORG_ADMIN', 'BRANCH_MANAGER', 'STAFF'];

// Public endpoints
router.get('/', organizationController.getOrganizations);
router.get('/public', organizationController.getPublicOrganizations);
router.post('/register', organizationController.registerOrganizationPublic);
router.get('/resolve-qr/:code', qrController.resolveQr);
router.get('/branch/:branchId', organizationController.getBranch);
router.get('/branch/:branchId/analytics', organizationController.getBranchAnalytics);

// Organization Approval Workflow (Super Admin Platform Oversight)
router.get('/pending', authenticate, authorize(SUPER_ADMIN_ONLY), organizationController.getPendingOrganizations);
router.post('/:orgId/approve', authenticate, authorize(SUPER_ADMIN_ONLY), organizationController.approveOrganization);
router.post('/:orgId/reject', authenticate, authorize(SUPER_ADMIN_ONLY), organizationController.rejectOrganization);

// QR Management endpoints (Restricted to Org Admin & Branch Managers - Super Admin excluded from QR ops)
router.get('/branch/:branchId/qr', authenticate, authorize(STAFF_OPERATIONAL), qrController.getBranchQRs);
router.get('/branch/:branchId/qr-list', authenticate, authorize(STAFF_OPERATIONAL), qrController.getBranchQrList);
router.get('/branch/:branchId/qr-stats', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), qrController.getBranchQrStats);
router.post('/branch/:branchId/qr', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), qrController.generateBranchQr);
router.post('/qr/:qrId/revoke', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), qrController.revokeQr);
router.delete('/qr/:qrId', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), qrController.deleteQr);

// Organization management
router.post('/', authenticate, authorize(SUPER_ADMIN_ONLY), organizationController.createOrganization);
router.get('/:orgId/details', authenticate, authorize(ADMIN_ROLES), organizationController.getOrganizationDetails);
router.get('/:orgId', authenticate, authorize(ADMIN_ROLES), organizationController.getOrganization);
router.put('/:orgId', authenticate, authorize(ADMIN_ROLES), organizationController.updateOrganization);
router.get('/:orgId/analytics', authenticate, authorize(ADMIN_ROLES), organizationController.getOrganizationAnalytics);
router.post('/:orgId/staff', authenticate, authorize(ADMIN_ROLES), organizationController.createOrgStaff);
router.get('/:orgId/staff', authenticate, authorize(ADMIN_ROLES), organizationController.getOrgStaff);

// Branch management
router.post('/:orgId/branch', authenticate, authorize(ADMIN_ROLES), organizationController.createBranch);
router.put('/branch/:branchId', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), organizationController.updateBranch);
router.post('/branch/:branchId/staff', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), organizationController.assignStaff);

// Service management
router.post('/branch/:branchId/service', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), organizationController.createService);
router.put('/service/:serviceId', authenticate, authorize(ORG_AND_BRANCH_MANAGERS), organizationController.updateService);

export default router;
