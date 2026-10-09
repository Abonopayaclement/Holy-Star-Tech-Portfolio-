import { Router } from 'express';
import * as skillController from '../controllers/skillController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const ADMIN_ROLES = ['ORG_ADMIN', 'SUPER_ADMIN'];
const STAFF_OR_ADMIN_ROLES = ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'];

// Skills CRUD
router.post('/organizations/:orgId/skills', authenticate, authorize(ADMIN_ROLES), skillController.createSkill);
router.get('/organizations/:orgId/skills', authenticate, authorize(STAFF_OR_ADMIN_ROLES), skillController.getSkills);
router.delete('/organizations/:orgId/skills/:skillId', authenticate, authorize(ADMIN_ROLES), skillController.deleteSkill);

// Staff Skills
router.post('/organizations/:orgId/staff/:staffId/skills', authenticate, authorize(ADMIN_ROLES), skillController.assignSkillToStaff);
router.delete('/organizations/:orgId/staff/:staffId/skills/:skillId', authenticate, authorize(ADMIN_ROLES), skillController.removeSkillFromStaff);
router.get('/organizations/:orgId/staff/:staffId/skills', authenticate, authorize(STAFF_OR_ADMIN_ROLES), skillController.getStaffSkills);

// Service Skill Requirements
router.post('/organizations/:orgId/services/:serviceId/skills', authenticate, authorize(ADMIN_ROLES), skillController.setServiceSkillRequirements);
router.get('/organizations/:orgId/services/:serviceId/skills', authenticate, authorize(STAFF_OR_ADMIN_ROLES), skillController.getServiceSkillRequirements);

export default router;
