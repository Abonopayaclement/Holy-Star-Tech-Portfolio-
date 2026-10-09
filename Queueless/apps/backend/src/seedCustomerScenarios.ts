import dotenv from 'dotenv';
dotenv.config();

import prisma from './config/prisma';
import { EntryStatus, AppointmentStatus, QueueStatus } from '@prisma/client';

export async function seedCustomerScenarios() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Seeding Distinct, High-Quality Customer Scenarios...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Fetch Customers
  const customerEmails = [
    'customer@queueless.com',
    'customer1@queueless.com',
    'customer2@queueless.com',
    'customer3@queueless.com',
    'customer4@queueless.com',
    'customer5@queueless.com',
  ];

  const customers = await prisma.user.findMany({
    where: { email: { in: customerEmails } },
  });

  const customerMap = new Map(customers.map((c) => [c.email, c]));
  for (const email of customerEmails) {
    if (!customerMap.has(email)) {
      throw new Error(`Customer ${email} not found in database!`);
    }
  }

  // 2. Fetch Organizations, Branches, Services, and Queues
  const orgs = await prisma.organization.findMany({
    include: {
      branches: {
        include: {
          services: {
            include: {
              queues: true,
            },
          },
        },
      },
    },
  });

  const getServiceAndQueue = (orgNamePrefix: string, branchNamePrefix: string, serviceNamePrefix: string) => {
    const org = orgs.find((o) => o.name.toLowerCase().includes(orgNamePrefix.toLowerCase()));
    if (!org) throw new Error(`Org matching '${orgNamePrefix}' not found`);
    const branch = org.branches.find((b) => b.name.toLowerCase().includes(branchNamePrefix.toLowerCase()));
    if (!branch) throw new Error(`Branch matching '${branchNamePrefix}' not found in ${org.name}`);
    const service = branch.services.find((s) => s.name.toLowerCase().includes(serviceNamePrefix.toLowerCase()));
    if (!service) throw new Error(`Service matching '${serviceNamePrefix}' not found in ${branch.name}`);
    let queue = service.queues[0];
    return { org, branch, service, queue };
  };

  // Ensure queues exist for our target services
  const ensureQueue = async (branchId: string, serviceId: string) => {
    let q = await prisma.queue.findFirst({ where: { branchId, serviceId } });
    if (!q) {
      q = await prisma.queue.create({
        data: { branchId, serviceId, status: QueueStatus.CLOSED },
      });
    }
    return q;
  };

  // 3. Clear existing queues and appointments for these 6 customers only
  const customerIds = customers.map((c) => c.id);
  await prisma.queueEntry.deleteMany({
    where: { userId: { in: customerIds } },
  });
  await prisma.appointment.deleteMany({
    where: { userId: { in: customerIds } },
  });
  console.log('🧹 Cleared existing appointments and queue entries for test customers.');

  // Helper date calculators
  const now = new Date();
  const daysFromNow = (days: number, hour = 10, minute = 30) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const daysAgo = (days: number, hour = 9, minute = 15) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // Target services
  const apexAirportTeller = getServiceAndQueue('Apex Bank', 'Airport City', 'Teller & Cash');
  const apexAirportLoan = getServiceAndQueue('Apex Bank', 'Airport City', 'Loan & Advisory');
  const apexAirportAccount = getServiceAndQueue('Apex Bank', 'Airport City', 'Customer Service & Account');
  const apexOsuCash = getServiceAndQueue('Apex Bank', 'Osu Oxford', 'Express Cash');

  const clinicRidgeOpd = getServiceAndQueue('St. Jude', 'Ridge Medical', 'General Outpatient');
  const clinicRidgeSpecialist = getServiceAndQueue('St. Jude', 'Ridge Medical', 'Specialist Medical');
  const clinicLegonPediatric = getServiceAndQueue('St. Jude', 'East Legon', 'Pediatric & Well-Baby');

  const dvlaLiberationLicense = getServiceAndQueue('DVLA', '37 Liberation', 'Driver License Renewal');
  const dvlaLiberationCommercial = getServiceAndQueue('DVLA', '37 Liberation', 'Commercial Transport');
  const dvlaTemaTruck = getServiceAndQueue('DVLA', 'Tema Industrial', 'Heavy Duty Truck');

  const clinicRidgePharmacy = getServiceAndQueue('St. Jude', 'Ridge Medical', 'Pharmacy & Medication');
  const apexAirportTeller2 = getServiceAndQueue('Apex Bank', 'Airport City', 'Teller & Cash');
  const dvlaTemaRegistration = getServiceAndQueue('DVLA', 'Tema Industrial', 'New Vehicle Registration');

  // Ensure queue instances
  const qApexTeller = await ensureQueue(apexAirportTeller.branch.id, apexAirportTeller.service.id);
  const qDvlaLicense = await ensureQueue(dvlaLiberationLicense.branch.id, dvlaLiberationLicense.service.id);
  const qClinicPharmacy = await ensureQueue(clinicRidgePharmacy.branch.id, clinicRidgePharmacy.service.id);
  const qClinicOpd = await ensureQueue(clinicRidgeOpd.branch.id, clinicRidgeOpd.service.id);
  const qDvlaRegistration = await ensureQueue(dvlaTemaRegistration.branch.id, dvlaTemaRegistration.service.id);
  const qDvlaTema = await ensureQueue(dvlaTemaTruck.branch.id, dvlaTemaTruck.service.id);
  const qApexOsu = await ensureQueue(apexOsuCash.branch.id, apexOsuCash.service.id);

  // =========================================================================
  // SCENARIO 1: customer@queueless.com (Abena Osei)
  // Multi-queue active + Upcoming & Past appointments
  // =========================================================================
  const c0 = customerMap.get('customer@queueless.com')!;
  
  // Active Queue 1: Apex Bank Airport City - Teller Services (Waiting, Position 2)
  await prisma.queueEntry.create({
    data: {
      userId: c0.id,
      queueId: qApexTeller.id,
      ticketNumber: 'T-002',
      position: 2,
      status: EntryStatus.WAITING,
      joinedAt: daysAgo(0, 9, 30),
    },
  });

  // Active Queue 2: DVLA 37 Liberation - Driver License Renewal (Waiting, Position 1)
  await prisma.queueEntry.create({
    data: {
      userId: c0.id,
      queueId: qDvlaLicense.id,
      ticketNumber: 'D-004',
      position: 1,
      status: EntryStatus.WAITING,
      joinedAt: daysAgo(0, 10, 15),
    },
  });

  // Completed Queue: St. Jude Pharmacy
  await prisma.queueEntry.create({
    data: {
      userId: c0.id,
      queueId: qClinicPharmacy.id,
      ticketNumber: 'P-008',
      position: 8,
      status: EntryStatus.COMPLETED,
      joinedAt: daysAgo(2, 11, 0),
      calledAt: daysAgo(2, 11, 20),
      completedAt: daysAgo(2, 11, 35),
    },
  });

  // Cancelled Queue: St. Jude Hospital OPD
  await prisma.queueEntry.create({
    data: {
      userId: c0.id,
      queueId: qClinicOpd.id,
      ticketNumber: 'G-005',
      position: 5,
      status: EntryStatus.CANCELLED,
      joinedAt: daysAgo(5, 8, 45),
      cancelledAt: daysAgo(5, 9, 10),
    },
  });

  // Appointment 1 (Upcoming): St. Jude Specialist Medical Consult tomorrow
  await prisma.appointment.create({
    data: {
      userId: c0.id,
      branchId: clinicRidgeSpecialist.branch.id,
      serviceId: clinicRidgeSpecialist.service.id,
      scheduledTime: daysFromNow(1, 10, 30),
      status: AppointmentStatus.CONFIRMED,
      notes: 'Cardiology follow-up consultation and blood pressure review.',
    },
  });

  // Appointment 2 (Upcoming): DVLA 37 Liberation Commercial Transport in 4 days
  await prisma.appointment.create({
    data: {
      userId: c0.id,
      branchId: dvlaLiberationCommercial.branch.id,
      serviceId: dvlaLiberationCommercial.service.id,
      scheduledTime: daysFromNow(4, 14, 0),
      status: AppointmentStatus.CONFIRMED,
      notes: 'Commercial vehicle permitting review.',
    },
  });

  // Appointment 3 (Past Completed): Apex Bank Airport City Loan Consultation 3 days ago
  await prisma.appointment.create({
    data: {
      userId: c0.id,
      branchId: apexAirportLoan.branch.id,
      serviceId: apexAirportLoan.service.id,
      scheduledTime: daysAgo(3, 11, 0),
      status: AppointmentStatus.COMPLETED,
      notes: 'SME business loan facility review.',
    },
  });

  console.log('✅ Scenario 1 seeded: customer@queueless.com (Multi-queue active + upcoming & past appts)');

  // =========================================================================
  // SCENARIO 2: customer1@queueless.com (Kwame Mensah)
  // Live SERVING queue ticket at St. Jude Clinic + DVLA appointment
  // =========================================================================
  const c1 = customerMap.get('customer1@queueless.com')!;

  await prisma.queueEntry.create({
    data: {
      userId: c1.id,
      queueId: qClinicOpd.id,
      ticketNumber: 'G-001',
      position: 1,
      status: EntryStatus.SERVING,
      joinedAt: daysAgo(0, 9, 0),
      calledAt: daysAgo(0, 9, 15),
      servingAt: daysAgo(0, 9, 20),
    },
  });

  await prisma.queueEntry.create({
    data: {
      userId: c1.id,
      queueId: qDvlaRegistration.id,
      ticketNumber: 'R-012',
      position: 12,
      status: EntryStatus.COMPLETED,
      joinedAt: daysAgo(6, 14, 0),
      calledAt: daysAgo(6, 14, 12),
      completedAt: daysAgo(6, 14, 25),
    },
  });

  await prisma.appointment.create({
    data: {
      userId: c1.id,
      branchId: dvlaLiberationCommercial.branch.id,
      serviceId: dvlaLiberationCommercial.service.id,
      scheduledTime: daysFromNow(5, 11, 30),
      status: AppointmentStatus.CONFIRMED,
      notes: 'Ride-hailing fleet permit renewal.',
    },
  });

  console.log('✅ Scenario 2 seeded: customer1@queueless.com (Live SERVING ticket + DVLA appt)');

  // =========================================================================
  // SCENARIO 3: customer2@queueless.com (Fatima Al-Hassan)
  // Live CALLING queue ticket at DVLA + audio chime + Apex Bank appointment
  // =========================================================================
  const c2 = customerMap.get('customer2@queueless.com')!;

  await prisma.queueEntry.create({
    data: {
      userId: c2.id,
      queueId: qDvlaTema.id,
      ticketNumber: 'H-001',
      position: 1,
      status: EntryStatus.CALLING,
      joinedAt: daysAgo(0, 9, 45),
      calledAt: new Date(),
    },
  });

  await prisma.queueEntry.create({
    data: {
      userId: c2.id,
      queueId: qApexOsu.id,
      ticketNumber: 'E-003',
      position: 3,
      status: EntryStatus.SKIPPED,
      joinedAt: daysAgo(1, 10, 0),
      calledAt: daysAgo(1, 10, 20),
    },
  });

  await prisma.appointment.create({
    data: {
      userId: c2.id,
      branchId: apexAirportAccount.branch.id,
      serviceId: apexAirportAccount.service.id,
      scheduledTime: daysFromNow(2, 15, 0),
      status: AppointmentStatus.CONFIRMED,
      notes: 'Apex Bank corporate banking account consultation.',
    },
  });

  console.log('✅ Scenario 3 seeded: customer2@queueless.com (Live CALLING ticket + Bank appt)');

  // =========================================================================
  // SCENARIO 4: customer3@queueless.com (David Tetteh)
  // Apex Bank queue + Pediatric clinic appointment
  // =========================================================================
  const c3 = customerMap.get('customer3@queueless.com')!;

  await prisma.queueEntry.create({
    data: {
      userId: c3.id,
      queueId: qApexTeller.id,
      ticketNumber: 'M-002',
      position: 1,
      status: EntryStatus.WAITING,
      joinedAt: daysAgo(0, 10, 0),
    },
  });

  await prisma.appointment.create({
    data: {
      userId: c3.id,
      branchId: clinicLegonPediatric.branch.id,
      serviceId: clinicLegonPediatric.service.id,
      scheduledTime: daysFromNow(3, 9, 30),
      status: AppointmentStatus.CONFIRMED,
      notes: 'Routine child immunization and pediatric checkup.',
    },
  });

  console.log('✅ Scenario 4 seeded: customer3@queueless.com (Bank queue + Pediatric appt)');

  // =========================================================================
  // SCENARIO 5: customer4@queueless.com (Esi Annan)
  // DVLA queue + Bank account opening appointment
  // =========================================================================
  const c4 = customerMap.get('customer4@queueless.com')!;

  await prisma.queueEntry.create({
    data: {
      userId: c4.id,
      queueId: qDvlaLicense.id,
      ticketNumber: 'S-002',
      position: 2,
      status: EntryStatus.WAITING,
      joinedAt: daysAgo(0, 10, 10),
    },
  });

  await prisma.appointment.create({
    data: {
      userId: c4.id,
      branchId: apexAirportAccount.branch.id,
      serviceId: apexAirportAccount.service.id,
      scheduledTime: daysFromNow(3, 13, 30),
      status: AppointmentStatus.CONFIRMED,
      notes: 'Corporate account opening documentation review.',
    },
  });

  console.log('✅ Scenario 5 seeded: customer4@queueless.com (Passport queue + Bank appt)');

  // =========================================================================
  // SCENARIO 6: customer5@queueless.com (Emmanuel Sowah)
  // Fresh, clean slate: 0 active queues, 0 appointments for testing from scratch
  // =========================================================================
  console.log('✅ Scenario 6 seeded: customer5@queueless.com (Fresh clean slate: 0 queues, 0 appts)');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Customer Scenarios Successfully Seeded!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

if (require.main === module) {
  seedCustomerScenarios()
    .catch((e) => {
      console.error('Scenario seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
