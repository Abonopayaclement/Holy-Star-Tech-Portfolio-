import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import * as userService from '../services/userService';

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { amount, metadata } = req.body;
    const userId = (req as any).user.id;
    const user = await userService.getUserById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const transaction = await paymentService.initializeTransaction(
      user.email,
      amount,
      user.id,
      metadata
    );

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const reference = req.params.reference as string;
    const verification = await paymentService.verifyTransaction(reference);
    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
