require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Creating QRCode table if not exists...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`QRCode\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`organizationId\` VARCHAR(191) NOT NULL,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`serviceId\` VARCHAR(191) NOT NULL,
      \`token\` VARCHAR(191) NOT NULL UNIQUE,
      \`type\` VARCHAR(50) NOT NULL DEFAULT 'SERVICE',
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      \`expiresAt\` DATETIME(3) NULL,
      \`revokedAt\` DATETIME(3) NULL,
      \`createdBy\` VARCHAR(191) NULL,
      \`revokedBy\` VARCHAR(191) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("QRCode table created/verified successfully.");

  const services = await prisma.$queryRawUnsafe(`
    SELECT s.id as serviceId, s.name as serviceName, s.branchId, b.name as branchName, b.organizationId
    FROM \`Service\` s
    JOIN \`Branch\` b ON s.branchId = b.id
    WHERE s.isActive = 1
  `);

  console.log(`Found ${services.length} active services. Generating active QR tokens...`);
  for (const s of services) {
    const bPrefix = (s.branchName || 'QL').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const sPrefix = (s.serviceName || 'SVC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    const token = `QR-${bPrefix}-${sPrefix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const qrId = `qr-${s.serviceId}`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO \`QRCode\` (\`id\`, \`organizationId\`, \`branchId\`, \`serviceId\`, \`token\`, \`type\`, \`status\`, \`createdBy\`, \`createdAt\`)
      VALUES (?, ?, ?, ?, ?, 'SERVICE', 'ACTIVE', 'System Provisioning', CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE \`status\` = 'ACTIVE';
    `, qrId, s.organizationId, s.branchId, s.serviceId, token);
  }

  const [cnt] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`QRCode\``);
  console.log(`✅ Successfully verified and seeded ${cnt.count} QR codes!`);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
