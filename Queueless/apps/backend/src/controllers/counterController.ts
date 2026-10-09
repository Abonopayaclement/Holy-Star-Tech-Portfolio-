import { Request, Response } from 'express';
import * as counterService from '../services/counterService';

export const getCountersByBranch = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }
    const counters = await counterService.getCountersByBranch(branchId);
    res.json(counters);
  } catch (error: any) {
    console.error('Error fetching counters:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch counters' });
  }
};

export const createCounter = async (req: Request, res: Response) => {
  try {
    const staffUser = (req as any).user;
    const { branchId, counterNumber, name } = req.body;

    if (!branchId || !counterNumber) {
      return res.status(400).json({ error: 'branchId and counterNumber are required' });
    }

    const counter = await counterService.createCounter(
      { branchId, counterNumber, name },
      staffUser?.id
    );

    res.status(201).json(counter);
  } catch (error: any) {
    console.error('Error creating counter:', error);
    res.status(400).json({ error: error.message || 'Failed to create counter' });
  }
};

export const updateCounterStatus = async (req: Request, res: Response) => {
  try {
    const counterId = req.params.id as string;
    const { status, ticketNumber, entryId, serviceId } = req.body;
    const staffUser = (req as any).user;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const updated = await counterService.setCounterStatus(
      counterId,
      status,
      staffUser?.id,
      { ticketNumber, entryId, serviceId }
    );

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating counter status:', error);
    res.status(400).json({ error: error.message || 'Failed to update counter status' });
  }
};

export const assignStaff = async (req: Request, res: Response) => {
  try {
    const counterId = req.params.id as string;
    const staffUser = (req as any).user;
    const { staffId, serviceId } = req.body;

    const assignedStaffId = staffId || staffUser?.id;
    if (!assignedStaffId) {
      return res.status(400).json({ error: 'staffId is required' });
    }

    const updated = await counterService.assignStaffToCounter(
      counterId,
      assignedStaffId,
      serviceId || null,
      staffUser?.id
    );

    res.json(updated);
  } catch (error: any) {
    console.error('Error assigning staff to counter:', error);
    res.status(400).json({ error: error.message || 'Failed to assign staff' });
  }
};

export const deleteCounter = async (req: Request, res: Response) => {
  try {
    const counterId = req.params.id as string;
    const staffUser = (req as any).user;
    const result = await counterService.deleteCounter(counterId, staffUser?.id);
    res.json(result);
  } catch (error: any) {
    console.error('Error deleting counter:', error);
    res.status(400).json({ error: error.message || 'Failed to delete counter' });
  }
};
