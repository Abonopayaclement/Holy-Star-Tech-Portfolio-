require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log("=== TESTING NEW QUEUELESS DATABASE CAPABILITIES ===");

  // 1. Test /analytics/users query
  const users = await prisma.$queryRawUnsafe(`
    SELECT 
      u.id, u.fullName, u.email, u.role, u.phoneNumber, u.organizationId, u.staffBranchId, u.createdAt,
      o.name as organizationName,
      b.name as branchName
    FROM \`queueless_user\` u
    LEFT JOIN \`Organization\` o ON u.organizationId = o.id
    LEFT JOIN \`Branch\` b ON u.staffBranchId = b.id
    WHERE u.role != 'CUSTOMER'
    ORDER BY u.createdAt DESC
  `);
  console.log(`✅ Staff Users found: ${users.length} staff members (Super Admin directory test passed)`);
  if (users.length > 0) {
    console.log(`   Sample staff: ${users[0].fullName} (${users[0].role}) @ ${users[0].organizationName} - ${users[0].branchName}`);
  }

  // 2. Test QRCode table
  const [qrCount] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`QRCode\``);
  console.log(`✅ Total QR codes in DB: ${qrCount.count}`);

  // 3. Test QR for a branch
  const branch = await prisma.$queryRawUnsafe(`SELECT id, name FROM \`Branch\` LIMIT 1`);
  if (branch.length > 0) {
    const branchId = branch[0].id;
    const branchQrs = await prisma.$queryRawUnsafe(`
      SELECT q.*, s.name as serviceName
      FROM \`QRCode\` q
      JOIN \`Service\` s ON q.serviceId = s.id
      WHERE q.branchId = ?
    `, branchId);
    console.log(`✅ QR codes for branch "${branch[0].name}": ${branchQrs.length} records`);
  }

  console.log("🎉 ALL NEW DATABASE QUERIES VERIFIED SUCCESSFULLY!");
  await prisma.$disconnect();
}

test().catch(console.error);
