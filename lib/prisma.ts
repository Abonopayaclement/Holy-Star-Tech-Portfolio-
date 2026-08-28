import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Always attach to globalThis to prevent multiple connection pools across serverless function re-evaluations
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

