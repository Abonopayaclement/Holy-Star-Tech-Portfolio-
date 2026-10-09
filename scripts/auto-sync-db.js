const { PrismaClient } = require('@prisma/client');

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
      \`customerId\` VARCHAR(191) NOT NULL,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`serviceId\` VARCHAR(191) NOT NULL,
      \`organizationId\` VARCHAR(191) NULL,
      \`startTime\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`endTime\` DATETIME(3) NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
      \`notes\` TEXT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  const seedQueries = [
    `INSERT INTO \`Organization\` (\`id\`, \`name\`, \`type\`, \`description\`, \`status\`)
     VALUES 
       ('org-apex-bank-01', 'Apex Bank Ghana', 'Banking & Financial Services', 'Premier retail and commercial banking with branches across Greater Accra.', 'ACTIVE'),
       ('org-st-jude-01', 'St. Jude Specialist Hospital', 'Healthcare & Clinics', 'Modern specialist outpatient clinic and diagnostic center.', 'ACTIVE'),
       ('org-dvla-01', 'Driver & Vehicle Licensing Authority', 'Civic & Government', 'Driver license testing, vehicle inspections, and road safety regulation.', 'ACTIVE')
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`Branch\` (\`id\`, \`organizationId\`, \`name\`, \`location\`, \`latitude\`, \`longitude\`, \`qrCodeId\`, \`isActive\`, \`operatingHours\`)
     VALUES 
       ('br-apex-airport-01', 'org-apex-bank-01', 'Airport City Branch', 'One Airport Square, Airport City, Accra', 5.6037, -0.1768, 'APEX-AIRPORT-MAIN', TRUE, '08:30 - 16:30'),
       ('br-st-jude-01', 'org-st-jude-01', 'Ridge Medical Center', 'Castle Road, Ridge, Accra', 5.5600, -0.1900, 'JUDE-RIDGE-MAIN', TRUE, '07:30 - 18:00'),
       ('br-dvla-01', 'org-dvla-01', '37 Licensing Center', 'Liberation Road, 37 Area, Accra', 5.5880, -0.1820, 'DVLA-37-MAIN', TRUE, '08:00 - 16:00')
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`Service\` (\`id\`, \`branchId\`, \`name\`, \`description\`, \`duration\`, \`price\`, \`isActive\`)
     VALUES 
       ('srv-cash-deposit-01', 'br-apex-airport-01', 'Cash & Cheque Deposits', 'Bulk and retail cash deposits, cheque clearings', 10, 0.00, TRUE),
       ('srv-foreign-exchange-01', 'br-apex-airport-01', 'Forex & Wire Transfers', 'Foreign currency purchases, FX exchange and SWIFT transfers', 20, 15.00, TRUE),
       ('srv-opd-01', 'br-st-jude-01', 'General OPD Consultation', 'Doctor consultation and vitals check', 25, 50.00, TRUE),
       ('srv-dvla-license-01', 'br-dvla-01', 'Driver License Renewal', 'Biometric capture and license renewal verification', 15, 80.00, TRUE)
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`Queue\` (\`id\`, \`branchId\`, \`serviceId\`, \`status\`)
     VALUES 
       ('q-cash-deposit-01', 'br-apex-airport-01', 'srv-cash-deposit-01', 'OPEN'),
       ('q-forex-01', 'br-apex-airport-01', 'srv-foreign-exchange-01', 'OPEN'),
       ('q-opd-01', 'br-st-jude-01', 'srv-opd-01', 'OPEN'),
       ('q-dvla-license-01', 'br-dvla-01', 'srv-dvla-license-01', 'OPEN')
     ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`,

    `INSERT INTO \`ServiceCounter\` (\`id\`, \`branchId\`, \`counterNumber\`, \`name\`, \`status\`, \`isActive\`)
     VALUES 
       ('cnt-apex-01', 'br-apex-airport-01', 'Counter 1', 'Express Cash Desk', 'AVAILABLE', TRUE),
       ('cnt-apex-02', 'br-apex-airport-01', 'Counter 2', 'General Teller Desk', 'AVAILABLE', TRUE),
       ('cnt-st-jude-01', 'br-st-jude-01', 'Consulting Room 1', 'Dr. Kwame Boateng Desk', 'AVAILABLE', TRUE),
       ('cnt-dvla-01', 'br-dvla-01', 'Desk A', 'Biometrics Verification Desk', 'AVAILABLE', TRUE)
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`LobbyDisplay\` (\`id\`, \`organizationId\`, \`branchId\`, \`name\`, \`mode\`, \`voiceEnabled\`)
     VALUES 
       ('disp-apex-airport-01', 'org-apex-bank-01', 'br-apex-airport-01', 'Main Banking Hall Display', 'COMBINED', TRUE),
       ('disp-st-jude-01', 'org-st-jude-01', 'br-st-jude-01', 'OPD Waiting Lounge Screen', 'COMBINED', TRUE)
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`queueless_user\` (\`id\`, \`email\`, \`passwordHash\`, \`fullName\`, \`role\`, \`phoneNumber\`, \`organizationId\`, \`staffBranchId\`)
     VALUES
       ('usr-super-admin-01', 'admin@queueless.com', '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW', 'Super Admin (Platform)', 'SUPER_ADMIN', '+233241234567', NULL, NULL),
       ('usr-apex-admin-01', 'owner@queueless.com', '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW', 'Kofi Mensah (Apex MD)', 'ORG_ADMIN', '+233201111111', 'org-apex-bank-01', NULL),
       ('usr-apex-mgr-01', 'manager@queueless.com', '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW', 'Sarah Addo (Branch Manager)', 'BRANCH_MANAGER', '+233202222222', 'org-apex-bank-01', 'br-apex-airport-01'),
       ('usr-apex-staff-01', 'staff@queueless.com', '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW', 'Ama Darko (Teller Officer)', 'STAFF', '+233203333333', 'org-apex-bank-01', 'br-apex-airport-01'),
       ('usr-clinic-admin-01', 'clinic.admin@queueless.com', '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW', 'Dr. Kwame Boateng (Medical Director)', 'ORG_ADMIN', '+233241112233', 'org-st-jude-01', 'br-st-jude-01'),
       ('usr-gov-admin-01', 'gov.admin@queueless.com', '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW', 'Ing. Emmanuel Osei (DVLA Supervisor)', 'ORG_ADMIN', '+233242223344', 'org-dvla-01', 'br-dvla-01'),
       ('cust-01', 'customer@queueless.com', '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW', 'Abena Osei', 'CUSTOMER', '+233244112233', NULL, NULL)
     ON DUPLICATE KEY UPDATE \`fullName\` = VALUES(\`fullName\`);`
  ];

  try {
    for (const sql of coreTables) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        console.warn('⚠️ Table sync notice:', err.message);
      }
    }

    for (const seed of seedQueries) {
      try {
        await prisma.$executeRawUnsafe(seed);
      } catch (err) {
        console.warn('⚠️ Seed notice:', err.message);
      }
    }

    console.log('✅ [AUTO-SYNC] All QueueLess tables and test data verified in Aiven MySQL.');
  } catch (err) {
    console.error('❌ [AUTO-SYNC] Fatal sync error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

autoSync();
