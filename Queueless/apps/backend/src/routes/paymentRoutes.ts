import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, paymentController.initializePayment);
router.get('/verify/:reference', authenticate, paymentController.verifyPayment);

export default router;
