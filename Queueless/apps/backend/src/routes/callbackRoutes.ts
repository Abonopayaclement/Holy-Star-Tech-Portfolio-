import { Router } from 'express';
import * as callbackController from '../controllers/callbackController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, callbackController.createOrUpdateCallback);
router.get('/active/:entryId', authenticate, callbackController.getActiveCallback);
router.post('/:id/acknowledge', authenticate, callbackController.acknowledgeCallback);
router.post('/:id/cancel', authenticate, callbackController.cancelCallback);

export default router;
