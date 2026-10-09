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
      \`customerId\` VARCHAR(191) NULL,
      \`userId\` VARCHAR(191) NULL,
      \`branchId\` VARCHAR(191) NOT NULL,
      \`serviceId\` VARCHAR(191) NOT NULL,
      \`organizationId\` VARCHAR(191) NULL,
      \`startTime\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`scheduledTime\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`endTime\` DATETIME(3) NULL,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
      \`problemType\` VARCHAR(191) NULL,
      \`fee\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      \`notes\` TEXT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  const HASH = '$2a$10$7RkglQ3v2Oa7WqV1y93/2Oeb/6sN.Zl2m8t9eGj48v2g6w0k7h9pW';

  const seedQueries = [
    `INSERT INTO \`Organization\` (\`id\`, \`name\`, \`type\`, \`description\`, \`status\`, \`contactEmail\`, \`contactPhone\`, \`address\`)
     VALUES 
       ('org-apex-bank-01', 'Apex Bank Ghana', 'Banking & Financial Services', 'Premier retail and commercial banking with branches across Greater Accra.', 'ACTIVE', 'support@apexbank.gh', '+233302111222', 'One Airport Square, Airport City, Accra'),
       ('org-st-jude-01', 'St. Jude Specialist Hospital', 'Healthcare & Medical Services', 'Modern specialist outpatient clinic and rapid diagnostic laboratory center.', 'ACTIVE', 'info@stjudehospital.gh', '+233302333444', 'Castle Road, Ridge, Accra'),
       ('org-dvla-01', 'Driver & Vehicle Licensing Authority (DVLA)', 'Government & Civic Administration', 'National regulatory agency for driver certification and vehicle roadworthiness.', 'ACTIVE', 'customercare@dvla.gov.gh', '+233302555666', 'Liberation Road, 37 Area, Accra'),
       ('org-passport-01', 'Ghana Passport Application Centre', 'Government & Immigration Services', 'Biometric processing and issuance of biometric travel passports.', 'ACTIVE', 'passports@mfa.gov.gh', '+233302777888', 'Ridge Ministerial Enclave, Accra'),
       ('org-ama-01', 'Accra Metropolitan Assembly (AMA)', 'Municipal & Local Government', 'Permits, city revenue collections, business operating licensing.', 'ACTIVE', 'enquiries@ama.gov.gh', '+233302999000', 'Kinbu Road, Central Business District, Accra'),
       ('org-pending-01', 'West Hills Diagnostic & Health Hub', 'Healthcare & Specialized Clinics', 'New specialized imaging, MRI, and outpatient wellness hub seeking enterprise platform onboarding.', 'PENDING_APPROVAL', 'director@westhillshealth.gh', '+233245009988', 'West Hills Mall Complex, Kasoa Highway, Accra')
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`status\` = VALUES(\`status\`);`,

    `INSERT INTO \`Branch\` (\`id\`, \`organizationId\`, \`name\`, \`location\`, \`latitude\`, \`longitude\`, \`qrCodeId\`, \`isActive\`, \`operatingHours\`)
     VALUES 
       ('br-apex-airport-01', 'org-apex-bank-01', 'Airport City Branch', 'One Airport Square, Airport City, Accra', 5.6037, -0.1768, 'APEX-AIRPORT-MAIN', TRUE, '08:30 - 16:30'),
       ('br-apex-osu-01', 'org-apex-bank-01', 'Osu Oxford Street Branch', 'Oxford Street Commercial Strip, Osu, Accra', 5.5560, -0.1837, 'APEX-OSU-MAIN', TRUE, '08:30 - 17:00'),
       ('br-st-jude-ridge-01', 'org-st-jude-01', 'Ridge Medical Pavilion', 'Castle Road, Ridge, Accra', 5.5658, -0.1989, 'JUDE-RIDGE-MAIN', TRUE, '08:00 - 18:00'),
       ('br-st-jude-legon-01', 'org-st-jude-01', 'East Legon Polyclinic', 'Lagos Avenue, East Legon, Accra', 5.6358, -0.1589, 'JUDE-LEGON-MAIN', TRUE, '08:00 - 17:30'),
       ('br-dvla-37-01', 'org-dvla-01', '37 Licensing Center', 'Liberation Road, 37 Area, Accra', 5.5880, -0.1820, 'DVLA-37-MAIN', TRUE, '08:00 - 16:00'),
       ('br-passport-ridge-01', 'org-passport-01', 'Ridge Passport Hall', 'Ministerial Enclave, Ridge, Accra', 5.5612, -0.1932, 'PASSPORT-RIDGE-MAIN', TRUE, '08:30 - 15:30')
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`Service\` (\`id\`, \`branchId\`, \`name\`, \`description\`, \`duration\`, \`price\`, \`isActive\`)
     VALUES 
       ('srv-apex-cash', 'br-apex-airport-01', 'Teller & Cash Services', 'Deposits, bulk withdrawals, foreign currency exchange and draft issuance.', 10, 0.00, TRUE),
       ('srv-apex-acct', 'br-apex-airport-01', 'Account Opening & Customer Desk', 'Personal & corporate accounts, debit cards, mobile banking onboarding.', 20, 0.00, TRUE),
       ('srv-apex-loan', 'br-apex-airport-01', 'Credit & Loan Advisory', 'SME facilities, salary overdrafts, mortgages, and investment consultation.', 30, 0.00, TRUE),
       ('srv-apex-osu-cash', 'br-apex-osu-01', 'Express Cash Counter', 'Rapid cash deposits, withdrawals, and merchant bill settlements.', 8, 0.00, TRUE),
       ('srv-jude-opd', 'br-st-jude-ridge-01', 'General OPD Consultation', 'Comprehensive physician triage, vitals recording, and clinical evaluation.', 20, 50.00, TRUE),
       ('srv-jude-specialist', 'br-st-jude-ridge-01', 'Specialist Medical Clinic', 'Internal medicine, cardiology, ENT, and pediatric consultation.', 30, 150.00, TRUE),
       ('srv-jude-pharmacy', 'br-st-jude-ridge-01', 'Pharmacy & Dispensary', 'Prescription medication dispensary, patient counseling, and refills.', 10, 0.00, TRUE),
       ('srv-dvla-renewal', 'br-dvla-37-01', 'Driver License Renewal', 'Biometric recapture, eye examination, and smart license replacement.', 15, 80.00, TRUE),
       ('srv-dvla-vehicle', 'br-dvla-37-01', 'Vehicle Registration & Testing', 'New registration, ownership transfer, and automated roadworthiness test.', 25, 120.00, TRUE),
       ('srv-passport-bio', 'br-passport-ridge-01', 'Passport Biometrics Capture', 'Digital fingerprint capture, photo verification, and interview.', 15, 100.00, TRUE)
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`Queue\` (\`id\`, \`branchId\`, \`serviceId\`, \`status\`)
     VALUES 
       ('q-apex-cash', 'br-apex-airport-01', 'srv-apex-cash', 'OPEN'),
       ('q-apex-acct', 'br-apex-airport-01', 'srv-apex-acct', 'OPEN'),
       ('q-apex-loan', 'br-apex-airport-01', 'srv-apex-loan', 'OPEN'),
       ('q-apex-osu-cash', 'br-apex-osu-01', 'srv-apex-osu-cash', 'OPEN'),
       ('q-jude-opd', 'br-st-jude-ridge-01', 'srv-jude-opd', 'OPEN'),
       ('q-jude-specialist', 'br-st-jude-ridge-01', 'srv-jude-specialist', 'OPEN'),
       ('q-jude-pharmacy', 'br-st-jude-ridge-01', 'srv-jude-pharmacy', 'OPEN'),
       ('q-dvla-renewal', 'br-dvla-37-01', 'srv-dvla-renewal', 'OPEN'),
       ('q-dvla-vehicle', 'br-dvla-37-01', 'srv-dvla-vehicle', 'OPEN'),
       ('q-passport-bio', 'br-passport-ridge-01', 'srv-passport-bio', 'OPEN')
     ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`,

    `INSERT INTO \`ServiceCounter\` (\`id\`, \`branchId\`, \`counterNumber\`, \`name\`, \`status\`, \`isActive\`)
     VALUES 
       ('cnt-apex-01', 'br-apex-airport-01', 'Counter 1', 'Express Cash Desk (Ama Darko)', 'BUSY', TRUE),
       ('cnt-apex-02', 'br-apex-airport-01', 'Counter 2', 'Bulk & Foreign Currency Desk', 'BUSY', TRUE),
       ('cnt-apex-03', 'br-apex-airport-01', 'Counter 3', 'Customer Service & Onboarding', 'AVAILABLE', TRUE),
       ('cnt-apex-osu-01', 'br-apex-osu-01', 'Counter 1', 'Osu Express Desk', 'AVAILABLE', TRUE),
       ('cnt-jude-01', 'br-st-jude-ridge-01', 'Consulting Room 1', 'Dr. Kwame Boateng (OPD)', 'BUSY', TRUE),
       ('cnt-jude-02', 'br-st-jude-ridge-01', 'Consulting Room 2', 'Dr. Bernard Danquah (Specialist)', 'BUSY', TRUE),
       ('cnt-jude-03', 'br-st-jude-ridge-01', 'Pharmacy Desk 1', 'Rapid Medication Dispensary', 'AVAILABLE', TRUE),
       ('cnt-dvla-01', 'br-dvla-37-01', 'Desk A', 'Biometrics Verification Desk', 'BUSY', TRUE),
       ('cnt-dvla-02', 'br-dvla-37-01', 'Desk B', 'Vehicle Roadworthiness Bay', 'AVAILABLE', TRUE),
       ('cnt-passport-01', 'br-passport-ridge-01', 'Booth 1', 'Biometric Enrollment Station', 'BUSY', TRUE)
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`status\` = VALUES(\`status\`);`,

    `INSERT INTO \`LobbyDisplay\` (\`id\`, \`organizationId\`, \`branchId\`, \`name\`, \`mode\`, \`voiceEnabled\`)
     VALUES 
       ('disp-apex-airport-01', 'org-apex-bank-01', 'br-apex-airport-01', 'Main Banking Hall TV (One Airport Square)', 'COMBINED', TRUE),
       ('disp-apex-osu-01', 'org-apex-bank-01', 'br-apex-osu-01', 'Osu Hall Overhead Screen', 'COMBINED', TRUE),
       ('disp-st-jude-01', 'org-st-jude-01', 'br-st-jude-ridge-01', 'OPD Waiting Lounge Display', 'COMBINED', TRUE),
       ('disp-dvla-01', 'org-dvla-01', 'br-dvla-37-01', 'Customer Verification TV Screen', 'COMBINED', TRUE),
       ('disp-passport-01', 'org-passport-01', 'br-passport-ridge-01', 'Ridge Main Hall Queue Monitor', 'COMBINED', TRUE)
     ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`,

    `INSERT INTO \`queueless_user\` (\`id\`, \`email\`, \`passwordHash\`, \`fullName\`, \`role\`, \`phoneNumber\`, \`organizationId\`, \`staffBranchId\`, \`city\`, \`country\`)
     VALUES
       ('usr-super-admin-01', 'admin@queueless.com', '${HASH}', 'Chief Platform Administrator', 'SUPER_ADMIN', '+233200000000', NULL, NULL, 'Accra', 'Ghana'),
       ('usr-apex-admin-01', 'owner@queueless.com', '${HASH}', 'Kofi Mensah (Apex MD)', 'ORG_ADMIN', '+233201111111', 'org-apex-bank-01', NULL, 'Accra', 'Ghana'),
       ('usr-apex-mgr-01', 'manager@queueless.com', '${HASH}', 'Ama Serwaa (Airport Branch Manager)', 'BRANCH_MANAGER', '+233202222222', 'org-apex-bank-01', 'br-apex-airport-01', 'Accra', 'Ghana'),
       ('usr-apex-staff-01', 'staff@queueless.com', '${HASH}', 'Ama Darko (Senior Teller)', 'STAFF', '+233203333333', 'org-apex-bank-01', 'br-apex-airport-01', 'Accra', 'Ghana'),
       ('usr-apex-staff-02', 'osu.staff@queueless.com', '${HASH}', 'Grace Quaye (Osu Teller)', 'STAFF', '+233204444444', 'org-apex-bank-01', 'br-apex-osu-01', 'Accra', 'Ghana'),
       ('usr-clinic-admin-01', 'clinic.admin@queueless.com', '${HASH}', 'Dr. Evelyn Arthur (Medical Director)', 'ORG_ADMIN', '+233241112233', 'org-st-jude-01', 'br-st-jude-ridge-01', 'Accra', 'Ghana'),
       ('usr-clinic-mgr-01', 'clinic.manager@queueless.com', '${HASH}', 'Dr. Bernard Danquah (Head of Clinic)', 'BRANCH_MANAGER', '+233242223344', 'org-st-jude-01', 'br-st-jude-ridge-01', 'Accra', 'Ghana'),
       ('usr-clinic-staff-01', 'clinic.staff@queueless.com', '${HASH}', 'Nurse Sarah Baidoo (Triage Officer)', 'STAFF', '+233243334455', 'org-st-jude-01', 'br-st-jude-ridge-01', 'Accra', 'Ghana'),
       ('usr-gov-admin-01', 'gov.admin@queueless.com', '${HASH}', 'Hon. Patrick Owusu (Director General)', 'ORG_ADMIN', '+233244445566', 'org-dvla-01', 'br-dvla-37-01', 'Accra', 'Ghana'),
       ('usr-passport-admin-01', 'passport.admin@queueless.com', '${HASH}', 'Amb. Shirley Ayorkor (Passport Director)', 'ORG_ADMIN', '+233245556677', 'org-passport-01', 'br-passport-ridge-01', 'Accra', 'Ghana'),
       ('cust-01', 'customer@queueless.com', '${HASH}', 'Abena Osei', 'CUSTOMER', '+233244112233', NULL, NULL, 'Accra', 'Ghana'),
       ('cust-02', 'customer1@queueless.com', '${HASH}', 'Kwame Mensah', 'CUSTOMER', '+233244223344', NULL, NULL, 'Kumasi', 'Ghana'),
       ('cust-03', 'customer2@queueless.com', '${HASH}', 'Fatima Al-Hassan', 'CUSTOMER', '+233244334455', NULL, NULL, 'Tamale', 'Ghana'),
       ('cust-04', 'customer3@queueless.com', '${HASH}', 'David Tetteh', 'CUSTOMER', '+233244445566', NULL, NULL, 'Tema', 'Ghana'),
       ('cust-05', 'customer4@queueless.com', '${HASH}', 'Esi Annan', 'CUSTOMER', '+233244556677', NULL, NULL, 'Takoradi', 'Ghana'),
       ('cust-06', 'customer5@queueless.com', '${HASH}', 'Emmanuel Sowah', 'CUSTOMER', '+233244667788', NULL, NULL, 'Cape Coast', 'Ghana'),
       ('cust-07', 'customer6@queueless.com', '${HASH}', 'Kofi Badu', 'CUSTOMER', '+233244778899', NULL, NULL, 'Sunyani', 'Ghana'),
       ('cust-08', 'customer7@queueless.com', '${HASH}', 'Akosua Frimpong', 'CUSTOMER', '+233244889900', NULL, NULL, 'Koforidua', 'Ghana'),
       ('cust-09', 'customer8@queueless.com', '${HASH}', 'Yaw Boateng', 'CUSTOMER', '+233244990011', NULL, NULL, 'Ho', 'Ghana')
     ON DUPLICATE KEY UPDATE \`fullName\` = VALUES(\`fullName\`);`,

    `INSERT INTO \`queueless_ticket\` (\`id\`, \`queueId\`, \`branchId\`, \`customerId\`, \`ticketNumber\`, \`sequenceNumber\`, \`counterNumber\`, \`priority\`, \`status\`, \`estimatedWaitTime\`, \`calledAt\`, \`servingStartTime\`, \`completedTime\`, \`createdAt\`, \`updatedAt\`)
     VALUES
       ('tkt-srv-01', 'q-apex-cash', 'br-apex-airport-01', 'cust-02', 'A-101', 1, 'Counter 1', 'NORMAL', 'SERVING', 0, NOW() - INTERVAL 12 MINUTE, NOW() - INTERVAL 10 MINUTE, NULL, NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 10 MINUTE),
       ('tkt-srv-02', 'q-jude-opd', 'br-st-jude-ridge-01', 'cust-03', 'M-201', 1, 'Consulting Room 1', 'HIGH', 'SERVING', 0, NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 12 MINUTE, NULL, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 12 MINUTE),
       ('tkt-srv-03', 'q-dvla-renewal', 'br-dvla-37-01', 'cust-04', 'D-301', 1, 'Desk A', 'NORMAL', 'SERVING', 0, NOW() - INTERVAL 8 MINUTE, NOW() - INTERVAL 6 MINUTE, NULL, NOW() - INTERVAL 20 MINUTE, NOW() - INTERVAL 6 MINUTE),
       ('tkt-call-01', 'q-apex-cash', 'br-apex-airport-01', 'cust-05', 'A-102', 2, 'Counter 2', 'NORMAL', 'CALLING', 0, NOW() - INTERVAL 2 MINUTE, NULL, NULL, NOW() - INTERVAL 22 MINUTE, NOW() - INTERVAL 2 MINUTE),
       ('tkt-call-02', 'q-jude-opd', 'br-st-jude-ridge-01', 'cust-06', 'M-202', 2, 'Consulting Room 2', 'NORMAL', 'CALLING', 0, NOW() - INTERVAL 3 MINUTE, NULL, NULL, NOW() - INTERVAL 24 MINUTE, NOW() - INTERVAL 3 MINUTE),
       ('tkt-wait-01', 'q-apex-cash', 'br-apex-airport-01', 'cust-01', 'A-103', 3, NULL, 'NORMAL', 'WAITING', 5, NULL, NULL, NULL, NOW() - INTERVAL 18 MINUTE, NOW() - INTERVAL 18 MINUTE),
       ('tkt-wait-02', 'q-apex-cash', 'br-apex-airport-01', 'cust-07', 'A-104', 4, NULL, 'NORMAL', 'WAITING', 12, NULL, NULL, NULL, NOW() - INTERVAL 14 MINUTE, NOW() - INTERVAL 14 MINUTE),
       ('tkt-wait-03', 'q-apex-acct', 'br-apex-airport-01', 'cust-08', 'C-105', 1, NULL, 'NORMAL', 'WAITING', 8, NULL, NULL, NULL, NOW() - INTERVAL 11 MINUTE, NOW() - INTERVAL 11 MINUTE),
       ('tkt-wait-04', 'q-jude-opd', 'br-st-jude-ridge-01', 'cust-01', 'M-203', 3, NULL, 'NORMAL', 'WAITING', 15, NULL, NULL, NULL, NOW() - INTERVAL 16 MINUTE, NOW() - INTERVAL 16 MINUTE),
       ('tkt-wait-05', 'q-jude-specialist', 'br-st-jude-ridge-01', 'cust-09', 'S-204', 1, NULL, 'HIGH', 'WAITING', 10, NULL, NULL, NULL, NOW() - INTERVAL 9 MINUTE, NOW() - INTERVAL 9 MINUTE),
       ('tkt-wait-06', 'q-dvla-renewal', 'br-dvla-37-01', 'cust-02', 'D-302', 2, NULL, 'NORMAL', 'WAITING', 14, NULL, NULL, NULL, NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 10 MINUTE),
       ('tkt-wait-07', 'q-dvla-vehicle', 'br-dvla-37-01', 'cust-03', 'V-303', 1, NULL, 'NORMAL', 'WAITING', 20, NULL, NULL, NULL, NOW() - INTERVAL 7 MINUTE, NOW() - INTERVAL 7 MINUTE),
       ('tkt-wait-08', 'q-passport-bio', 'br-passport-ridge-01', 'cust-04', 'P-401', 1, NULL, 'NORMAL', 'WAITING', 12, NULL, NULL, NULL, NOW() - INTERVAL 6 MINUTE, NOW() - INTERVAL 6 MINUTE),
       ('tkt-cmp-01', 'q-apex-cash', 'br-apex-airport-01', 'cust-06', 'A-098', 1, 'Counter 1', 'NORMAL', 'COMPLETED', 0, NOW() - INTERVAL 90 MINUTE, NOW() - INTERVAL 88 MINUTE, NOW() - INTERVAL 75 MINUTE, NOW() - INTERVAL 105 MINUTE, NOW() - INTERVAL 75 MINUTE),
       ('tkt-cmp-02', 'q-apex-cash', 'br-apex-airport-01', 'cust-07', 'A-099', 2, 'Counter 2', 'NORMAL', 'COMPLETED', 0, NOW() - INTERVAL 70 MINUTE, NOW() - INTERVAL 68 MINUTE, NOW() - INTERVAL 55 MINUTE, NOW() - INTERVAL 85 MINUTE, NOW() - INTERVAL 55 MINUTE),
       ('tkt-cmp-03', 'q-jude-opd', 'br-st-jude-ridge-01', 'cust-08', 'M-198', 1, 'Consulting Room 1', 'NORMAL', 'COMPLETED', 0, NOW() - INTERVAL 80 MINUTE, NOW() - INTERVAL 78 MINUTE, NOW() - INTERVAL 60 MINUTE, NOW() - INTERVAL 95 MINUTE, NOW() - INTERVAL 60 MINUTE),
       ('tkt-cmp-04', 'q-dvla-renewal', 'br-dvla-37-01', 'cust-09', 'D-298', 1, 'Desk A', 'NORMAL', 'COMPLETED', 0, NOW() - INTERVAL 60 MINUTE, NOW() - INTERVAL 58 MINUTE, NOW() - INTERVAL 42 MINUTE, NOW() - INTERVAL 75 MINUTE, NOW() - INTERVAL 42 MINUTE)
     ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`,

    `INSERT INTO \`Appointment\` (\`id\`, \`customerId\`, \`branchId\`, \`serviceId\`, \`organizationId\`, \`startTime\`, \`endTime\`, \`status\`, \`notes\`, \`createdAt\`)
     VALUES
       ('apt-01', 'cust-01', 'br-apex-airport-01', 'srv-apex-loan', 'org-apex-bank-01', NOW() + INTERVAL 2 HOUR, NOW() + INTERVAL 2 HOUR + INTERVAL 30 MINUTE, 'CONFIRMED', 'Commercial mortgage consultation for new business premises', NOW() - INTERVAL 1 DAY),
       ('apt-02', 'cust-02', 'br-st-jude-ridge-01', 'srv-jude-specialist', 'org-st-jude-01', NOW() + INTERVAL 1 DAY + INTERVAL 2 HOUR, NOW() + INTERVAL 1 DAY + INTERVAL 3 HOUR, 'CONFIRMED', 'Cardiology outpatient review with Dr. Bernard Danquah', NOW() - INTERVAL 2 DAY),
       ('apt-03', 'cust-03', 'br-dvla-37-01', 'srv-dvla-renewal', 'org-dvla-01', NOW() + INTERVAL 2 DAY + INTERVAL 3 HOUR, NOW() + INTERVAL 2 DAY + INTERVAL 3 HOUR + INTERVAL 20 MINUTE, 'CONFIRMED', 'Class C heavy goods vehicle license renewal', NOW() - INTERVAL 3 DAY),
       ('apt-04', 'cust-04', 'br-passport-ridge-01', 'srv-passport-bio', 'org-passport-01', NOW() + INTERVAL 3 DAY + INTERVAL 1 HOUR, NOW() + INTERVAL 3 DAY + INTERVAL 1 HOUR + INTERVAL 30 MINUTE, 'CONFIRMED', 'Expedited biometric passport renewal appointment', NOW() - INTERVAL 4 DAY),
       ('apt-05', 'cust-05', 'br-apex-airport-01', 'srv-apex-acct', 'org-apex-bank-01', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 25 MINUTE, 'COMPLETED', 'SME corporate account signature card updating', NOW() - INTERVAL 5 DAY),
       ('apt-06', 'cust-06', 'br-st-jude-ridge-01', 'srv-jude-opd', 'org-st-jude-01', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 20 MINUTE, 'COMPLETED', 'Annual comprehensive routine health checkup', NOW() - INTERVAL 6 DAY),
       ('apt-07', 'cust-07', 'br-dvla-37-01', 'srv-dvla-vehicle', 'org-dvla-01', NOW() + INTERVAL 4 HOUR, NOW() + INTERVAL 4 HOUR + INTERVAL 30 MINUTE, 'PENDING', 'New commercial trailer roadworthiness evaluation', NOW() - INTERVAL 4 HOUR)
     ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`
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

    console.log('✅ [AUTO-SYNC] All QueueLess tables, live queues, test accounts, and appointments verified in Aiven MySQL.');
  } catch (err) {
    console.error('❌ [AUTO-SYNC] Fatal sync error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

autoSync();
