import dotenv from 'dotenv';
dotenv.config();

import prisma from '../src/config/prisma';
import { QueueStatus } from '@prisma/client';

async function main() {
  console.log('Fetching all queues...');
  const allQueues = await prisma.queue.findMany({
    include: {
      service: {
        select: {
          name: true,
        },
      },
      branch: {
        select: {
          name: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${allQueues.length} queues in total.`);

  const updateResult = await prisma.queue.updateMany({
    data: {
      status: QueueStatus.CLOSED,
    },
  });

  console.log(`✅ Successfully closed ${updateResult.count} queues!`);

  const updatedQueues = await prisma.queue.findMany({
    select: {
      id: true,
      status: true,
      service: { select: { name: true } },
      branch: {
        select: {
          name: true,
          organization: { select: { name: true } },
        },
      },
    },
  });

  console.log('\n--- Current Queues Status ---');
  for (const q of updatedQueues) {
    console.log(
      `• [${q.status}] ${q.branch.organization.name} -> ${q.branch.name} -> ${q.service.name} (ID: ${q.id})`
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error closing queues:', e);
  await prisma.$disconnect();
  process.exit(1);
});
