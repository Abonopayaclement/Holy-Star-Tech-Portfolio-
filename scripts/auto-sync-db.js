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
  console.log('  AUTO-SYNC: VERIFYING DATABASE & IMPORTING REAL QUEUELESS DATA   ');
  console.log('==================================================================');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  const coreTables = [
    `CREATE TABLE IF NOT EXISTS \`queueless_user\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`email\` VARCHAR(191) NOT NULL UNIQUE,
      \`passwordHash\` VARCHAR(255) NOT NULL,
      \`fullName\` VARCHAR(191) NOT NULL,
      \`role\` VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
      \`phoneNumber\` VARCHAR(50) NULL,
      \`profilePhoto\` TEXT NULL,
      \`organizationId\` VARCHAR(191) NULL,
      \`staffBranchId\` VARCHAR(191) NULL,
      \`city\` VARCHAR(100) NULL,
      \`country\` VARCHAR(100) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Organization\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`name\` VARCHAR(191) NOT NULL,
      \`type\` VARCHAR(191) NOT NULL,
      \`description\` TEXT NULL,
      \`logo\` TEXT NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      \`contactEmail\` VARCHAR(191) NULL,
      \`contactPhone\` VARCHAR(50) NULL,
      \`address\` TEXT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Branch\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`organizationId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`location\` TEXT NULL,
      \`latitude\` DOUBLE NULL,
      \`longitude\` DOUBLE NULL,
      \`qrCodeId\` VARCHAR(191) NULL,
      \`isActive\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`operatingHours\` VARCHAR(191) NULL DEFAULT '08:30 - 17:00',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Service\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`description\` TEXT NULL,
      \`duration\` INT NOT NULL DEFAULT 15,
      \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      \`isActive\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Queue\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`serviceId\` VARCHAR(191) NOT NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'OPEN',
      \`closedReason\` TEXT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`queueless_ticket\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`queueId\` VARCHAR(191) NOT NULL,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`customerId\` VARCHAR(191) NULL,
      \`ticketNumber\` VARCHAR(50) NOT NULL,
      \`sequenceNumber\` INT NOT NULL DEFAULT 1,
      \`counterNumber\` VARCHAR(50) NULL,
      \`priority\` VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'WAITING',
      \`estimatedWaitTime\` INT NOT NULL DEFAULT 10,
      \`calledAt\` DATETIME(3) NULL,
      \`servingStartTime\` DATETIME(3) NULL,
      \`completedTime\` DATETIME(3) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`QueueEntry\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`queueId\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NULL,
      \`ticketNumber\` VARCHAR(50) NOT NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'WAITING',
      \`position\` INT NOT NULL DEFAULT 1,
      \`counterNumber\` VARCHAR(50) NULL,
      \`priority\` VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
      \`joinedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`calledAt\` DATETIME(3) NULL,
      \`servingAt\` DATETIME(3) NULL,
      \`completedAt\` DATETIME(3) NULL,
      \`cancelledAt\` DATETIME(3) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`ServiceCounter\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`counterNumber\` VARCHAR(50) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
      \`isActive\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`LobbyDisplay\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`organizationId\` VARCHAR(191) NOT NULL,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`mode\` VARCHAR(50) NOT NULL DEFAULT 'COMBINED',
      \`voiceEnabled\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Appointment\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`customerId\` VARCHAR(191) NULL,
      \`userId\` VARCHAR(191) NULL,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`serviceId\` VARCHAR(191) NOT NULL,
      \`organizationId\` VARCHAR(191) NULL,
      \`startTime\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`scheduledTime\` DATETIME(3) NULL,
      \`endTime\` DATETIME(3) NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
      \`problemType\` VARCHAR(191) NULL,
      \`fee\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      \`notes\` TEXT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  try {
    for (const sql of coreTables) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        // Non-blocking notice
      }
    }

    // Load full exported data if available
    let backupPath = path.join(__dirname, '..', 'lib', 'queueless', 'data', 'queueless_seed.json');
    if (!fs.existsSync(backupPath)) {
      backupPath = path.join(__dirname, '..', 'backups', 'queueless_local_full_export.json');
    }
    if (fs.existsSync(backupPath)) {
      console.log('📦 Found complete local QueueLess backup (' + backupPath + '). Replicating all user-created queues, branches, and tickets to cloud DB...');
      const fullData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

      // 1. Organizations
      if (Array.isArray(fullData.Organization)) {
        for (const o of fullData.Organization) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`Organization\` (\`id\`, \`name\`, \`type\`, \`description\`, \`logo\`, \`status\`, \`contactEmail\`, \`contactPhone\`, \`address\`)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`status\` = VALUES(\`status\`);`,
              o.id, o.name, o.type, o.description || null, o.logo || null, o.status || 'ACTIVE', o.contactEmail || null, o.contactPhone || null, o.address || null
            );
          } catch (e) {}
        }
        console.log(`✅ Synced ${fullData.Organization.length} Organizations`);
      }

      // 2. Branches
      if (Array.isArray(fullData.Branch)) {
        for (const b of fullData.Branch) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`Branch\` (\`id\`, \`organizationId\`, \`name\`, \`location\`, \`latitude\`, \`longitude\`, \`qrCodeId\`, \`isActive\`, \`operatingHours\`)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`isActive\` = VALUES(\`isActive\`);`,
              b.id, b.organizationId, b.name, b.location || null, b.latitude || null, b.longitude || null, b.qrCodeId || null, b.isActive ? 1 : 0, b.operatingHours || '08:30 - 17:00'
            );
          } catch (e) {}
        }
        console.log(`✅ Synced ${fullData.Branch.length} Branches`);
      }

      // 3. Services
      if (Array.isArray(fullData.Service)) {
        for (const s of fullData.Service) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`Service\` (\`id\`, \`branchId\`, \`name\`, \`description\`, \`duration\`, \`price\`, \`isActive\`)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`isActive\` = VALUES(\`isActive\`);`,
              s.id, s.branchId, s.name, s.description || null, s.duration || 15, s.price || 0.00, s.isActive ? 1 : 0
            );
          } catch (e) {}
        }
        console.log(`✅ Synced ${fullData.Service.length} Services`);
      }

      // 4. Queues
      if (Array.isArray(fullData.Queue)) {
        for (const q of fullData.Queue) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`Queue\` (\`id\`, \`branchId\`, \`serviceId\`, \`status\`, \`closedReason\`)
               VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`closedReason\` = VALUES(\`closedReason\`);`,
              q.id, q.branchId, q.serviceId, q.status || 'OPEN', q.closedReason || null
            );
          } catch (e) {}
        }
        console.log(`✅ Synced ${fullData.Queue.length} Queues`);
      }

      // 5. Users
      if (Array.isArray(fullData.User)) {
        for (const u of fullData.User) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`queueless_user\` (\`id\`, \`email\`, \`passwordHash\`, \`fullName\`, \`role\`, \`phoneNumber\`, \`organizationId\`, \`staffBranchId\`, \`city\`, \`country\`)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`fullName\` = VALUES(\`fullName\`), \`role\` = VALUES(\`role\`), \`organizationId\` = VALUES(\`organizationId\`), \`staffBranchId\` = VALUES(\`staffBranchId\`);`,
              u.id, u.email, u.passwordHash, u.fullName, u.role, u.phoneNumber || null, u.organizationId || null, u.staffBranchId || null, u.city || null, u.country || 'Ghana'
            );
          } catch (e) {}
        }
        console.log(`✅ Synced ${fullData.User.length} User accounts`);
      }

      // 6. QueueEntry (Tickets)
      if (Array.isArray(fullData.QueueEntry)) {
        for (const qe of fullData.QueueEntry) {
          try {
            // Find branchId for this queue
            const [qRow] = await prisma.$queryRawUnsafe(`SELECT branchId FROM \`Queue\` WHERE id = ? LIMIT 1`, qe.queueId);
            const branchId = qRow?.branchId || 'br-apex-airport-01';

            // Insert into QueueEntry
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`QueueEntry\` (\`id\`, \`queueId\`, \`userId\`, \`ticketNumber\`, \`status\`, \`position\`, \`counterNumber\`, \`priority\`, \`joinedAt\`, \`calledAt\`, \`servingAt\`, \`completedAt\`)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`counterNumber\` = VALUES(\`counterNumber\`);`,
              qe.id, qe.queueId, qe.userId || null, qe.ticketNumber, qe.status || 'WAITING', qe.position || 1, qe.counterNumber || null, qe.priority || 'NORMAL',
              qe.joinedAt ? new Date(qe.joinedAt) : new Date(), qe.calledAt ? new Date(qe.calledAt) : null, qe.servingAt ? new Date(qe.servingAt) : null, qe.completedAt ? new Date(qe.completedAt) : null
            );

            // Also insert into queueless_ticket
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`queueless_ticket\` (\`id\`, \`queueId\`, \`branchId\`, \`customerId\`, \`ticketNumber\`, \`sequenceNumber\`, \`counterNumber\`, \`priority\`, \`status\`, \`estimatedWaitTime\`, \`calledAt\`, \`servingStartTime\`, \`completedTime\`, \`createdAt\`)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`counterNumber\` = VALUES(\`counterNumber\`);`,
              qe.id, qe.queueId, branchId, qe.userId || null, qe.ticketNumber, qe.position || 1, qe.counterNumber || null, qe.priority || 'NORMAL', qe.status || 'WAITING', 10,
              qe.calledAt ? new Date(qe.calledAt) : null, qe.servingAt ? new Date(qe.servingAt) : null, qe.completedAt ? new Date(qe.completedAt) : null, qe.joinedAt ? new Date(qe.joinedAt) : new Date()
            );
          } catch (e) {}
        }
        console.log(`✅ Synced ${fullData.QueueEntry.length} Queue Tickets`);
      }

      // 7. Appointments
      if (Array.isArray(fullData.Appointment)) {
        for (const a of fullData.Appointment) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO \`Appointment\` (\`id\`, \`customerId\`, \`userId\`, \`branchId\`, \`serviceId\`, \`startTime\`, \`status\`, \`notes\`, \`problemType\`, \`fee\`)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`notes\` = VALUES(\`notes\`);`,
              a.id, a.userId || a.customerId, a.userId || a.customerId, a.branchId, a.serviceId,
              a.scheduledTime ? new Date(a.scheduledTime) : new Date(), a.status || 'CONFIRMED', a.notes || null, a.problemType || null, a.fee || 0.00
            );
          } catch (e) {}
        }
        console.log(`✅ Synced ${fullData.Appointment.length} Appointments`);
      }
    }

    console.log('🎉 [AUTO-SYNC] Complete local QueueLess data, queues, and appointments successfully synced to cloud DB!');
  } catch (err) {
    console.error('❌ [AUTO-SYNC] Sync notice:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

autoSync();
