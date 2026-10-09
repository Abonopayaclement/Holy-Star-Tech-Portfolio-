import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/conversations', authenticate, messageController.getOrCreateConversation);
router.get('/conversations/:id', authenticate, messageController.getConversation);
router.post('/conversations/:id/messages', authenticate, messageController.sendMessage);
router.patch('/conversations/:id/read', authenticate, messageController.markAsRead);
router.get('/branch/:branchId', authenticate, messageController.getBranchConversations);

export default router;
