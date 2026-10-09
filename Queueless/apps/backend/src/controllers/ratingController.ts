import { Request, Response } from 'express';
import * as ratingService from '../services/ratingService';

export const submitRating = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const userId = (req as any).user?.id;
    const { rating, feedback, tags } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const result = await ratingService.submitRating(entryId, userId, {
      rating,
      feedback,
      tags,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    res.status(400).json({ error: error.message || 'Failed to submit rating' });
  }
};

export const getBranchRatingSummary = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const summary = await ratingService.getBranchRatingSummary(branchId);
    res.json(summary);
  } catch (error: any) {
    console.error('Error getting branch ratings:', error);
    res.status(500).json({ error: 'Failed to retrieve rating summary' });
  }
};
