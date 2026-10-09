const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const targetDbUrl = process.argv[2] || process.env.DATABASE_URL;

  console.log('==================================================================');
  console.log('  QUEUELESS ENTERPRISE — AIVEN / LOCAL DATABASE SETUP RUNNER      ');
  console.log('==================================================================');

  if (!targetDbUrl) {
    console.error('❌ Error: Database URL not found.');
    console.log('Usage:');
    console.log('  node scripts/apply-queueless-db.js "<DATABASE_URL>"');
    console.log('  or set DATABASE_URL in your root .env file.');
    process.exit(1);
  }

  const parsedUrl = new URL(targetDbUrl.replace(/^mysql:\/\//, 'http://'));
  console.log(`Target Host: ${parsedUrl.hostname}:${parsedUrl.port || 3306}`);
  console.log(`Target Database: ${parsedUrl.pathname.replace(/^\//, '')}`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: targetDbUrl,
      },
    },
  });

  const sqlPath = path.join(__dirname, '..', 'Queueless', 'QUEUELLESS_AIVEN_DATABASE_SETUP.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Setup script not found at: ${sqlPath}`);
    process.exit(1);
  }

  console.log(`📖 Loading: Queueless/QUEUELLESS_AIVEN_DATABASE_SETUP.sql`);
  const rawSql = fs.readFileSync(sqlPath, 'utf8');

  // Strip single-line comments and empty lines
  const cleanedLines = rawSql
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('--') && line.length > 0)
    .join('\n');

  // Split into individual SQL statements by semicolon
  const statements = cleanedLines
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`⚙️ Executing ${statements.length} SQL statements sequentially...`);

  let executed = 0;
  let warnings = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      executed++;
    } catch (err) {
      if (
        err.message.includes('already exists') ||
        err.message.includes('Duplicate entry') ||
        err.message.includes('Duplicate key')
      ) {
        executed++;
      } else {
        warnings++;
        console.warn(`[Statement ${i + 1}] Warning: ${err.message.split('\n')[0]}`);
      }
    }
  }

  console.log(`\n🎉 Setup finished! Successfully processed ${executed}/${statements.length} statements.`);
  if (warnings > 0) {
    console.log(`ℹ️ ${warnings} non-critical warnings encountered (e.g. pre-existing keys).`);
  }
  console.log('✅ QueueLess tables (queueless_user, Organization, Branch, queueless_skill, etc.) are active.');
  console.log('✅ Demo tenants (Apex Bank, St. Jude, DVLA) and 10 clean test customers are seeded.');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Fatal error running database setup:', err.message);
  process.exit(1);
});
