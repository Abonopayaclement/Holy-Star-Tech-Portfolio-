import { Router } from 'express';
import * as kioskController from '../controllers/kioskController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const STAFF_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'];

// Public physical kiosk endpoints (Part 6 & 8: dedicated touch-screen mode)
router.get('/public/:branchId', kioskController.getKioskServices);
router.post('/ticket', kioskController.issueKioskTicket);

// Staff / Admin kiosk device management (Part 39)
router.get('/branch/:branchId', authenticate, authorize(STAFF_ROLES), kioskController.getKiosksByBranch);
router.post('/', authenticate, authorize(STAFF_ROLES), kioskController.createKiosk);
router.patch('/:id', authenticate, authorize(STAFF_ROLES), kioskController.updateKiosk);

export default router;
