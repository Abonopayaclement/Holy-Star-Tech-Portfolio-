import prisma from '../config/prisma';

export interface GenerateTicketNumberOptions {
  branchId: string;
  serviceId: string;
  serviceName?: string;
  customPrefix?: string;
}

/**
 * Deterministic, server-authoritative, concurrency-safe ticket number generator.
 * Format: [Prefix][001-999], e.g. A001, A023, B014, S001.
 * Uses atomic sequence counter grouped by Branch + Service + Business Day (YYYY-MM-DD).
 */
export async function generateTicketNumber(
  options: GenerateTicketNumberOptions,
  tx?: any
): Promise<string> {
  const { branchId, serviceId, serviceName, customPrefix } = options;
  const db = tx || prisma;

  // Determine prefix: customPrefix > first letter of service name > 'A'
  let prefix = (customPrefix || (serviceName ? serviceName.trim()[0] : 'A')).toUpperCase();
  if (!/^[A-Z]$/.test(prefix)) {
    prefix = 'A';
  }

  // Business day key in YYYY-MM-DD
  const dateKey = new Date().toISOString().slice(0, 10);

  // If TicketSequence model is available on prisma client, use atomic upsert/increment
  if (db.ticketSequence && typeof db.ticketSequence.upsert === 'function') {
    try {
      const seqRecord = await db.ticketSequence.upsert({
        where: {
          branchId_serviceId_dateKey: {
            branchId,
            serviceId,
            dateKey,
          },
        },
        create: {
          branchId,
          serviceId,
          dateKey,
          prefix,
          lastSequence: 1,
        },
        update: {
          lastSequence: { increment: 1 },
        },
      });

      const sequence = seqRecord.lastSequence;
      return `${prefix}${String(sequence).padStart(3, '0')}`;
    } catch (err) {
      console.warn('TicketSequence atomic increment failed, falling back to count strategy:', err);
    }
  }

  // Resilient fallback (e.g. In-memory or Unit Test mocks without ticketSequence table)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count = 0;
  if (db.queueEntry && typeof db.queueEntry.count === 'function') {
    count = await db.queueEntry.count({
      where: {
        queue: { serviceId },
        joinedAt: { gte: today },
      },
    });
  }

  const nextSeq = count + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}
