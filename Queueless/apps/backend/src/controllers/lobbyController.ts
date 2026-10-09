import { Request, Response } from 'express';
import * as lobbyService from '../services/lobbyService';
import prisma from '../config/prisma';

/**
 * Public Lobby Display State endpoint (Part 18, 19, 32, 33)
 * Strips all customer PII, returns current now serving, queue overview, and audio announcement.
 */
export const getLobbyState = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const state = await lobbyService.getLobbyState(branchId);
    res.json(state);
  } catch (error: any) {
    console.error('Error fetching lobby state:', error);
    res.status(400).json({ error: error.message || 'Failed to load lobby state' });
  }
};

/**
 * Get Lobby Display Configuration for branch
 */
export const getLobbyConfig = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const config = await prisma.lobbyDisplay.findFirst({
      where: { branchId, isActive: true },
    });
    res.json(config || { mode: 'COMBINED', voiceEnabled: true, name: 'Main Lobby TV' });
  } catch (error: any) {
    console.error('Error fetching lobby config:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch lobby configuration' });
  }
};

/**
 * Update / Upsert Lobby Display Configuration (Part 39)
 */
export const updateLobbyConfig = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const staffUser = (req as any).user;
    const { name, mode, serviceIds, voiceEnabled, announcementTemplate } = req.body;

    const display = await lobbyService.upsertLobbyDisplay(
      {
        branchId,
        name,
        mode,
        serviceIds,
        voiceEnabled,
        announcementTemplate,
      },
      staffUser?.id
    );

    res.json(display);
  } catch (error: any) {
    console.error('Error updating lobby display:', error);
    res.status(400).json({ error: error.message || 'Failed to update lobby display' });
  }
};
