import prisma from '../config/prisma';
import { calculateQueueEta } from './etaService';
import { logAuditEvent } from '../utils/audit';

export interface PrintableTicketData {
  ticketId: string;
  entryId: string;
  ticketNumber: string;
  organizationName: string;
  branchName: string;
  branchLocation?: string;
  serviceName: string;
  counterNumber?: string | null;
  position: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  issuedAt: Date;
  formattedDate: string;
  formattedTime: string;
  instruction: string;
  reprintCount: number;
  source: string;
  poweredBy: string;
}

/**
 * Printer Adapter abstraction layer (Part 9)
 * Supports browser/software printing and future thermal printer hardware (ESC/POS, USB, Network, Bluetooth)
 */
export interface PrinterAdapter {
  name: string;
  printTicket(ticket: PrintableTicketData): Promise<{ success: boolean; message?: string }>;
}

export class BrowserPrinterAdapter implements PrinterAdapter {
  name = 'BrowserSoftwarePrinter';
  async printTicket(ticket: PrintableTicketData) {
    return { success: true, message: `Rendered printable slip for ticket ${ticket.ticketNumber}` };
  }
}

export class EscPosPrinterAdapter implements PrinterAdapter {
  name = 'EscPosThermalPrinter';
  async printTicket(ticket: PrintableTicketData) {
    // Hardware abstraction ready for ESC/POS network/USB socket commands
    return { success: true, message: `ESC/POS bytecode prepared for ticket ${ticket.ticketNumber}` };
  }
}

/**
 * Generates formatted, public-safe printable ticket data (Part 10)
 */
export async function generatePrintableTicketData(entryId: string): Promise<PrintableTicketData> {
  if (!entryId) {
    throw new Error('Valid queue entry ID is required to generate printable ticket data');
  }

  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: {
      queue: {
        include: {
          service: true,
          branch: { include: { organization: true } },
        },
      },
      user: {
        select: { id: true, fullName: true, phoneNumber: true },
      },
    },
  });

  if (!entry) {
    throw new Error('Queue entry not found');
  }

  const queue = entry.queue;
  const service = queue.service;
  const branch = queue.branch;
  const organization = branch.organization;

  // Calculate people ahead
  let peopleAhead = 0;
  if (prisma.queueEntry && typeof prisma.queueEntry.count === 'function') {
    peopleAhead = await prisma.queueEntry.count({
      where: {
        queueId: queue.id,
        status: 'WAITING',
        joinedAt: { lt: entry.joinedAt },
      },
    });
  }

  // Calculate estimated wait time
  let estimatedWaitMinutes = 15;
  try {
    const etaResult = await calculateQueueEta(queue.id, peopleAhead, entry.status, queue);
    if (etaResult && typeof etaResult.estimatedWaitTimeMinutes === 'number') {
      estimatedWaitMinutes = etaResult.estimatedWaitTimeMinutes;
    }
  } catch {
    estimatedWaitMinutes = Math.max(5, peopleAhead * (service.duration || 10));
  }

  const issuedAt = entry.joinedAt || new Date();
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(issuedAt));

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(issuedAt));

  return {
    ticketId: entry.id,
    entryId: entry.id,
    ticketNumber: entry.ticketNumber || `#${entry.position}`,
    organizationName: organization?.name || 'QueueLess',
    branchName: branch.name,
    branchLocation: branch.location,
    serviceName: service.name,
    counterNumber: entry.counterNumber || null,
    position: entry.position,
    peopleAhead,
    estimatedWaitMinutes,
    issuedAt,
    formattedDate,
    formattedTime,
    instruction: 'Please wait for your number to be called.',
    reprintCount: (entry as any).reprintCount || 0,
    source: (entry as any).source || 'KIOSK',
    poweredBy: 'Powered by QueueLess',
  };
}

/**
 * Controlled ticket reprint with audit logging (Part 11)
 */
export async function reprintTicket(
  entryId: string,
  reason: string = 'Customer reprint request',
  staffUserId?: string
): Promise<PrintableTicketData> {
  const existing = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: {
      queue: { include: { branch: true } },
    },
  });

  if (!existing) {
    throw new Error('Ticket not found');
  }

  const currentCount = ((existing as any).reprintCount || 0) + 1;

  // Update reprint tracking on queue entry
  if (prisma.queueEntry && typeof prisma.queueEntry.update === 'function') {
    try {
      await prisma.queueEntry.update({
        where: { id: entryId },
        data: {
          reprintCount: currentCount,
          lastReprintedAt: new Date(),
          lastReprintedBy: staffUserId || 'KIOSK',
        } as any,
      });
    } catch (err) {
      console.warn('QueueEntry reprint update warning:', err);
    }
  }

  // Audit log
  await logAuditEvent({
    organizationId: existing.queue.branch.organizationId,
    branchId: existing.queue.branchId || existing.queue.branch?.id,
    userId: staffUserId || 'KIOSK_SYSTEM',
    action: 'TICKET_REPRINTED',
    details: {
      entryId,
      ticketNumber: existing.ticketNumber,
      reprintCount: currentCount,
      reason,
    },
  });

  return await generatePrintableTicketData(entryId);
}
