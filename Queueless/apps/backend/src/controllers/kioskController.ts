import { Request, Response } from 'express';
import * as kioskService from '../services/kioskService';

/**
 * Public Kiosk screen initialization endpoint (Part 6 & 8)
 * Returns active walk-in services and branch info with ZERO staff/admin/customer PII.
 */
export const getKioskServices = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const kioskId = req.query.kioskId as string | undefined;

    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }

    const data = await kioskService.getKioskBranchServices(branchId, kioskId);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching kiosk services:', error);
    res.status(400).json({ error: error.message || 'Failed to load kiosk services' });
  }
};

/**
 * Public Kiosk Ticket Issuance endpoint (Part 5, 25, 26, 28)
 * Generates unified walk-in queue entry with deterministic ticket number.
 */
export const issueKioskTicket = async (req: Request, res: Response) => {
  try {
    const { branchId, serviceId, kioskId, fullName, phoneNumber } = req.body;

    if (!branchId || !serviceId) {
      return res.status(400).json({ error: 'branchId and serviceId are required' });
    }

    const ticketData = await kioskService.issueKioskTicket({
      branchId,
      serviceId,
      kioskId,
      fullName,
      phoneNumber,
    });

    res.status(201).json(ticketData);
  } catch (error: any) {
    console.error('Error issuing kiosk ticket:', error);
    res.status(400).json({ error: error.message || 'Failed to issue ticket' });
  }
};

/**
 * Admin: List all kiosks for a branch
 */
export const getKiosksByBranch = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const kiosks = await kioskService.getKiosksByBranch(branchId);
    res.json(kiosks);
  } catch (error: any) {
    console.error('Error fetching kiosks:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch kiosks' });
  }
};

/**
 * Admin: Register a new kiosk
 */
export const createKiosk = async (req: Request, res: Response) => {
  try {
    const staffUser = (req as any).user;
    const { branchId, organizationId, name, deviceIdentifier, config } = req.body;

    if (!branchId || !name) {
      return res.status(400).json({ error: 'branchId and name are required' });
    }

    const kiosk = await kioskService.createKiosk(
      {
        branchId,
        organizationId: organizationId || staffUser?.organizationId,
        name,
        deviceIdentifier,
        config,
      },
      staffUser?.id
    );

    res.status(201).json(kiosk);
  } catch (error: any) {
    console.error('Error creating kiosk:', error);
    res.status(400).json({ error: error.message || 'Failed to create kiosk' });
  }
};

/**
 * Admin: Update kiosk status or configuration
 */
export const updateKiosk = async (req: Request, res: Response) => {
  try {
    const kioskId = req.params.id as string;
    const staffUser = (req as any).user;
    const updated = await kioskService.updateKiosk(kioskId, req.body, staffUser?.id);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating kiosk:', error);
    res.status(400).json({ error: error.message || 'Failed to update kiosk' });
  }
};
