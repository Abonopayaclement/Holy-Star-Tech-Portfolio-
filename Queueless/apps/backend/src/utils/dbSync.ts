import prisma from '../config/prisma';

export async function ensureDbSynced() {
  try {
    const rawCols: any = await prisma.$queryRawUnsafe('DESCRIBE `organization`;');
    const cols = Array.isArray(rawCols) ? rawCols.map((r: any) => r.Field) : [];

    if (!cols.includes('status')) {
      await prisma.$executeRawUnsafe("ALTER TABLE `organization` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';");
      console.log('✓ Added status column to organization table');
    }
    if (!cols.includes('contactEmail')) {
      await prisma.$executeRawUnsafe("ALTER TABLE `organization` ADD COLUMN `contactEmail` VARCHAR(191) NULL;");
      console.log('✓ Added contactEmail column to organization table');
    }
    if (!cols.includes('contactPhone')) {
      await prisma.$executeRawUnsafe("ALTER TABLE `organization` ADD COLUMN `contactPhone` VARCHAR(191) NULL;");
      console.log('✓ Added contactPhone column to organization table');
    }
    if (!cols.includes('address')) {
      await prisma.$executeRawUnsafe("ALTER TABLE `organization` ADD COLUMN `address` VARCHAR(191) NULL;");
      console.log('✓ Added address column to organization table');
    }
    console.log('✅ Database organization columns verified and in sync.');
  } catch (err: any) {
    console.warn('Note on organization db sync:', err?.message || err);
  }
}
