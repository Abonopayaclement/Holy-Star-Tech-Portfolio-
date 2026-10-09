import axios from 'axios';
import prisma from '../config/prisma';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const initializeTransaction = async (email: string, amount: number, userId: string, metadata: any) => {
  const response = await axios.post<any>(
    'https://api.paystack.co/transaction/initialize',
    {
      email,
      amount: amount * 100, // Paystack expects amount in pesewas/kobo
      metadata: {
        ...metadata,
        userId,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  // Create pending payment record
  await prisma.payment.create({
    data: {
      userId,
      amount,
      transactionRef: response.data.data.reference,
      status: 'PENDING',
      metadata,
    },
  });

  return response.data.data;
};

export const verifyTransaction = async (reference: string) => {
  const response = await axios.get<any>(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const { status, amount, metadata } = response.data.data;

  if (status === 'success') {
    await prisma.payment.update({
      where: { transactionRef: reference },
      data: { status: 'COMPLETED' },
    });
  } else {
    await prisma.payment.update({
      where: { transactionRef: reference },
      data: { status: 'FAILED' },
    });
  }

  return response.data.data;
};
