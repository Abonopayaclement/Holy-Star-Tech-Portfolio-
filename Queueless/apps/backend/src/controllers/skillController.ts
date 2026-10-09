import { Request, Response } from 'express';
import * as skillService from '../services/skillService';
import { canAccessOrganization, canAccessBranch } from '../utils/tenant';

export const createSkill = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot create skills for this organization' });
    }

    const skill = await skillService.createSkill(orgId, req.body, reqUser.id);
    res.status(201).json(skill);
  } catch (error: any) {
    console.error('Error creating skill:', error);
    res.status(400).json({ error: error.message || 'Failed to create skill' });
  }
};

export const getSkills = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot view skills for this organization' });
    }

    const skills = await skillService.getSkillsByOrganization(orgId);
    res.json(skills);
  } catch (error: any) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
};

export const deleteSkill = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const skillId = req.params.skillId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete skills for this organization' });
    }

    const result = await skillService.deleteSkill(skillId, orgId, reqUser.id);
    res.json(result);
  } catch (error: any) {
    console.error('Error deleting skill:', error);
    res.status(400).json({ error: error.message || 'Failed to delete skill' });
  }
};

export const assignSkillToStaff = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const staffId = req.params.staffId as string;
    const { skillId } = req.body;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot assign skills in this organization' });
    }

    if (!skillId) {
      return res.status(400).json({ error: 'skillId is required' });
    }

    const staffSkill = await skillService.assignSkillToStaff(staffId, skillId, reqUser.id, orgId);
    res.status(201).json(staffSkill);
  } catch (error: any) {
    console.error('Error assigning skill to staff:', error);
    res.status(400).json({ error: error.message || 'Failed to assign skill to staff' });
  }
};

export const removeSkillFromStaff = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const staffId = req.params.staffId as string;
    const skillId = req.params.skillId as string;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot remove skills in this organization' });
    }

    const result = await skillService.removeSkillFromStaff(staffId, skillId, reqUser.id, orgId);
    res.json(result);
  } catch (error: any) {
    console.error('Error removing skill from staff:', error);
    res.status(400).json({ error: error.message || 'Failed to remove skill from staff' });
  }
};

export const getStaffSkills = async (req: Request, res: Response) => {
  try {
    const staffId = req.params.staffId as string;
    const skills = await skillService.getStaffSkills(staffId);
    res.json(skills);
  } catch (error: any) {
    console.error('Error fetching staff skills:', error);
    res.status(500).json({ error: 'Failed to fetch staff skills' });
  }
};

export const setServiceSkillRequirements = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const serviceId = req.params.serviceId as string;
    const { skillIds } = req.body;
    const reqUser = (req as any).user;

    if (!canAccessOrganization(reqUser, orgId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot configure services for this organization' });
    }

    if (!Array.isArray(skillIds)) {
      return res.status(400).json({ error: 'skillIds must be an array of skill IDs' });
    }

    const requirements = await skillService.setServiceSkillRequirements(serviceId, skillIds, orgId, reqUser.id);
    res.json(requirements);
  } catch (error: any) {
    console.error('Error setting service skill requirements:', error);
    res.status(400).json({ error: error.message || 'Failed to set service skill requirements' });
  }
};

export const getServiceSkillRequirements = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId as string;
    const requirements = await skillService.getServiceSkillRequirements(serviceId);
    res.json(requirements);
  } catch (error: any) {
    console.error('Error fetching service skill requirements:', error);
    res.status(500).json({ error: 'Failed to fetch service skill requirements' });
  }
};
