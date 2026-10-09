import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.patch('/read-all', authenticate, notificationController.markAllAsRead);
router.post('/read-all', authenticate, notificationController.markAllAsRead);

// Device token endpoints
router.post('/devices', authenticate, notificationController.registerDevice);
router.delete('/devices/:deviceToken', authenticate, notificationController.removeDevice);

export default router;
