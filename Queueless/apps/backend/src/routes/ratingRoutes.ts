import { Router } from 'express';
import * as ratingController from '../controllers/ratingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/entry/:entryId', authenticate, ratingController.submitRating);
router.get('/branch/:branchId/summary', ratingController.getBranchRatingSummary);

export default router;
