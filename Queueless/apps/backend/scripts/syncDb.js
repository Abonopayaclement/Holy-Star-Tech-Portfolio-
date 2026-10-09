const mariadb = require('mariadb');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/queueless';
const url = new URL(dbUrl);

const pool = mariadb.createPool({
  host: url.hostname || 'localhost',
  port: url.port ? Number(url.port) : 3306,
  user: url.username || 'root',
  password: url.password || '',
  database: url.pathname.replace(/^\//, '') || 'queueless',
});

async function sync() {
  const conn = await pool.getConnection();
  try {
    console.log('Connected to MariaDB/MySQL. Syncing schema columns...');

    // 1. Add missing columns to `user`
    const userCols = (await conn.query('DESCRIBE `user`;')).map(r => r.Field);
    if (!userCols.includes('idType')) {
      await conn.query('ALTER TABLE `user` ADD COLUMN `idType` VARCHAR(191) NULL;');
      console.log('✓ Added idType to user');
    }
    if (!userCols.includes('idNumber')) {
      await conn.query('ALTER TABLE `user` ADD COLUMN `idNumber` VARCHAR(191) NULL;');
      console.log('✓ Added idNumber to user');
    }
    if (!userCols.includes('pushToken')) {
      await conn.query('ALTER TABLE `user` ADD COLUMN `pushToken` VARCHAR(191) NULL;');
      console.log('✓ Added pushToken to user');
    }

    // 2. Add missing columns to `queueentry`
    const qCols = (await conn.query('DESCRIBE `queueentry`;')).map(r => r.Field);
    if (!qCols.includes('counterNumber')) {
      await conn.query('ALTER TABLE `queueentry` ADD COLUMN `counterNumber` VARCHAR(191) NULL;');
      await conn.query('ALTER TABLE `queueentry` ADD INDEX `queueentry_counterNumber_idx` (`counterNumber`);');
      console.log('✓ Added counterNumber and index to queueentry');
    }
    if (!qCols.includes('servedByStaffId')) {
      await conn.query('ALTER TABLE `queueentry` ADD COLUMN `servedByStaffId` VARCHAR(191) NULL;');
      console.log('✓ Added servedByStaffId to queueentry');
    }

    // 3. Create `servicerating` table if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`servicerating\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`queueEntryId\` VARCHAR(191) NOT NULL,
        \`userId\` VARCHAR(191) NOT NULL,
        \`branchId\` VARCHAR(191) NULL,
        \`serviceId\` VARCHAR(191) NULL,
        \`rating\` INT NOT NULL,
        \`feedback\` TEXT NULL,
        \`tags\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`servicerating_queueEntryId_key\` (\`queueEntryId\`),
        INDEX \`servicerating_branchId_rating_idx\` (\`branchId\`, \`rating\`),
        INDEX \`servicerating_serviceId_rating_idx\` (\`serviceId\`, \`rating\`),
        INDEX \`servicerating_userId_idx\` (\`userId\`),
        CONSTRAINT \`servicerating_queueEntryId_fkey\` FOREIGN KEY (\`queueEntryId\`) REFERENCES \`queueentry\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`servicerating_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log('✓ Created servicerating table');

    console.log('✅ Database schema successfully synchronized with Prisma Client models!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

sync();
