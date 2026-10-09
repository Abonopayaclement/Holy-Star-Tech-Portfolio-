import { Router } from 'express';
import * as counterController from '../controllers/counterController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const OPERATIONAL_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN'];

// All counter management routes require branch operational staff authentication
router.use(authenticate, authorize(OPERATIONAL_ROLES));

router.get('/branch/:branchId', counterController.getCountersByBranch);
router.post('/', counterController.createCounter);
router.patch('/:id/status', counterController.updateCounterStatus);
router.post('/:id/assign', counterController.assignStaff);
router.delete('/:id', counterController.deleteCounter);

export default router;
