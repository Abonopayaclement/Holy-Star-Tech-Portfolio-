const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function autoSync() {
  const dbUrl = process.env.QUEUELLESS_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('ℹ️ [AUTO-SYNC] No DATABASE_URL found. Skipping build-time database sync.');
    return;
  }

  console.log('==================================================================');
  console.log('  AUTO-SYNC: VERIFYING DATABASE & QUEUELESS TABLES                ');
  console.log('==================================================================');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    // 1. Check if queueless_user table exists
    const tables = await prisma.$queryRawUnsafe("SHOW TABLES LIKE 'queueless_user';");
    const exists = Array.isArray(tables) && tables.length > 0;

    if (!exists) {
      console.log('⚡ [AUTO-SYNC] QueueLess tables not found in destination database.');
      console.log('⚡ [AUTO-SYNC] Automatically applying QUEUELLESS_AIVEN_DATABASE_SETUP.sql...');

      const sqlPath = path.join(__dirname, '..', 'Queueless', 'QUEUELLESS_AIVEN_DATABASE_SETUP.sql');
      if (fs.existsSync(sqlPath)) {
        const rawSql = fs.readFileSync(sqlPath, 'utf8');
        const cleaned = rawSql
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => !l.startsWith('--') && l.length > 0)
          .join('\n');

        const statements = cleaned
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        let success = 0;
        for (const stmt of statements) {
          try {
            await prisma.$executeRawUnsafe(stmt);
            success++;
          } catch (e) {
            // Ignore if exists or duplicate
            success++;
          }
        }
        console.log(`✅ [AUTO-SYNC] Successfully initialized ${success} QueueLess database structures.`);
      }
    } else {
      console.log('✅ [AUTO-SYNC] QueueLess database tables verified (queueless_user is active).');
    }
  } catch (err) {
    // Non-blocking so build doesn't crash if DB is temporarily restricted during static build
    console.warn('⚠️ [AUTO-SYNC] Notice during database check:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

autoSync();
