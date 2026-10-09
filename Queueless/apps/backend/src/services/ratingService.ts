import prisma from '../config/prisma';

export interface SubmitRatingDTO {
  rating: number; // 1 to 5
  feedback?: string;
  tags?: string;
}

export const submitRating = async (
  queueEntryId: string,
  userId: string,
  data: SubmitRatingDTO
) => {
  // Verify entry exists and belongs to the user
  const entry = await prisma.queueEntry.findUnique({
    where: { id: queueEntryId },
    include: {
      queue: {
        include: { service: true, branch: true },
      },
    },
  });

  if (!entry) {
    throw new Error('Queue ticket not found');
  }

  if (entry.userId !== userId) {
    throw new Error('Unauthorized: You can only rate your own tickets');
  }

  if (entry.status !== 'COMPLETED') {
    throw new Error('You can only rate completed service visits');
  }

  // Ensure rating is between 1 and 5
  const ratingValue = Math.max(1, Math.min(5, Math.round(data.rating)));

  return await prisma.serviceRating.upsert({
    where: { queueEntryId },
    update: {
      rating: ratingValue,
      feedback: data.feedback?.trim() || null,
      tags: data.tags || null,
    },
    create: {
      queueEntryId,
      userId,
      branchId: entry.queue.branchId,
      serviceId: entry.queue.serviceId,
      rating: ratingValue,
      feedback: data.feedback?.trim() || null,
      tags: data.tags || null,
    },
  });
};

export const getBranchRatingSummary = async (branchId: string) => {
  const ratings = await prisma.serviceRating.findMany({
    where: { branchId },
    select: { rating: true, tags: true, createdAt: true },
  });

  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const r of ratings) {
    sum += r.rating;
    if (distribution[r.rating as keyof typeof distribution] !== undefined) {
      distribution[r.rating as keyof typeof distribution]++;
    }
  }

  const averageRating = Math.round((sum / ratings.length) * 10) / 10;

  return {
    averageRating,
    totalRatings: ratings.length,
    distribution,
  };
};
