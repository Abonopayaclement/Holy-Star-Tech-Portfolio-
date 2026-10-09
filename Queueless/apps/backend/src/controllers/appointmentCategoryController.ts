import { Request, Response } from 'express';
import * as categoryService from '../services/appointmentCategoryService';

/**
 * GET /api/appointments/categories?branchId=...&serviceId=...
 * Customer-facing endpoint returning active, tenant-scoped categories
 */
export const getActiveCategories = async (req: Request, res: Response) => {
  try {
    const { branchId, serviceId } = req.query;

    if (!branchId || typeof branchId !== 'string') {
      return res.status(400).json({ error: 'branchId query parameter is required' });
    }

    const categories = await categoryService.getActiveCategories(
      branchId,
      typeof serviceId === 'string' ? serviceId : undefined
    );

    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching active appointment categories:', error);
    res.status(error.message === 'Branch not found' ? 404 : 500).json({
      error: error.message || 'Failed to fetch categories',
    });
  }
};

/**
 * GET /api/appointments/categories/manage?branchId=...&organizationId=...
 * Staff / Admin endpoint returning all categories for an organization/branch
 */
export const getCategoriesForStaff = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { branchId, organizationId } = req.query;

    const categories = await categoryService.getCategoriesForStaff(
      user,
      typeof branchId === 'string' ? branchId : undefined,
      typeof organizationId === 'string' ? organizationId : undefined
    );

    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories for staff:', error);
    const status = error.message.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ error: error.message || 'Failed to fetch categories' });
  }
};

/**
 * POST /api/appointments/categories
 * Staff / Admin creates a new category
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { organizationId, branchId, serviceId, name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const targetOrgId = organizationId || user.organizationId;
    if (!targetOrgId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const category = await categoryService.createCategory(user, {
      organizationId: targetOrgId,
      branchId: branchId || null,
      serviceId: serviceId || null,
      name: name.trim(),
      description: description || null,
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    const status = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ error: error.message || 'Failed to create category' });
  }
};

/**
 * PUT /api/appointments/categories/:id
 * Staff / Admin updates a category
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;
    const { name, description, isActive } = req.body;

    const category = await categoryService.updateCategory(user, id, {
      name,
      description,
      isActive,
    });

    res.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    const status = error.message.includes('Unauthorized')
      ? 403
      : error.message === 'Appointment category not found'
        ? 404
        : 400;
    res.status(status).json({ error: error.message || 'Failed to update category' });
  }
};

/**
 * PATCH /api/appointments/categories/:id/toggle
 * Toggle active/inactive
 */
export const toggleCategoryActive = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;

    const category = await categoryService.toggleCategoryActive(user, id);
    res.json(category);
  } catch (error: any) {
    console.error('Error toggling category status:', error);
    const status = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ error: error.message || 'Failed to toggle category' });
  }
};

/**
 * DELETE /api/appointments/categories/:id
 * Staff / Admin deletes or archives category
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;

    await categoryService.deleteCategory(user, id);
    res.json({ message: 'Category removed or archived successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    const status = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ error: error.message || 'Failed to delete category' });
  }
};
