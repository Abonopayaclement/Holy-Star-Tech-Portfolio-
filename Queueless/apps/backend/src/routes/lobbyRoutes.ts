import { Router } from 'express';
import * as lobbyController from '../controllers/lobbyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const BRANCH_ADMIN_ROLES = ['BRANCH_MANAGER', 'ORG_ADMIN'];

// Public TV Lobby Display state (Part 18, 19, 32, 33)
router.get('/:branchId/state', lobbyController.getLobbyState);
router.get('/:branchId/config', lobbyController.getLobbyConfig);

// Branch Manager / Org Admin display configuration
router.put('/:branchId/config', authenticate, authorize(BRANCH_ADMIN_ROLES), lobbyController.updateLobbyConfig);

export default router;
