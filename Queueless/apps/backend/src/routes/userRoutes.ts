import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);
router.post('/push-token', authenticate, userController.updatePushToken);
router.get('/staff', authenticate, authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_MANAGER']), userController.listOrganizationStaff);

export default router;
