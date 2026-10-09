import dotenv from 'dotenv';
dotenv.config();

import prisma from './config/prisma';
import { Role, QueueStatus, EntryStatus, AppointmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 Seeding QueueLess Platform with 5 Multi-Tenant Organizations...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);

  // 1. Global Platform Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@queueless.com' },
    update: { role: Role.SUPER_ADMIN },
    create: {
      email: 'admin@queueless.com',
      passwordHash: adminPasswordHash,
      fullName: 'Chief Platform Administrator',
      role: Role.SUPER_ADMIN,
      phoneNumber: '+233200000000',
    },
  });

  // Clean any active queue entries for testing rule
  await prisma.queueEntry.deleteMany();
  console.log('🧹 Cleaned all active queue entries for pristine testing slate.');

  // 2. Customers (10 realistic test customer accounts)
  const customerData = [
    { email: 'customer@queueless.com', name: 'Abena Osei', phone: '+233244112233', city: 'Accra' },
    { email: 'customer1@queueless.com', name: 'Kwame Mensah', phone: '+233244223344', city: 'Kumasi' },
    { email: 'customer2@queueless.com', name: 'Fatima Al-Hassan', phone: '+233244334455', city: 'Tamale' },
    { email: 'customer3@queueless.com', name: 'David Tetteh', phone: '+233244445566', city: 'Tema' },
    { email: 'customer4@queueless.com', name: 'Esi Annan', phone: '+233244556677', city: 'Takoradi' },
    { email: 'customer5@queueless.com', name: 'Emmanuel Sowah', phone: '+233244667788', city: 'Cape Coast' },
    { email: 'customer6@queueless.com', name: 'Kofi Badu', phone: '+233244778899', city: 'Sunyani' },
    { email: 'customer7@queueless.com', name: 'Akosua Frimpong', phone: '+233244889900', city: 'Koforidua' },
    { email: 'customer8@queueless.com', name: 'Yaw Boateng', phone: '+233244990011', city: 'Ho' },
    { email: 'customer9@queueless.com', name: 'Adwoa Mansa', phone: '+233244001122', city: 'Bolgatanga' },
  ];

  const seededCustomers: any[] = [];
  for (const c of customerData) {
    const cust = await prisma.user.upsert({
      where: { email: c.email },
      update: { role: Role.CUSTOMER, fullName: c.name, phoneNumber: c.phone, city: c.city, country: 'Ghana' },
      create: {
        email: c.email,
        passwordHash: defaultPasswordHash,
        fullName: c.name,
        role: Role.CUSTOMER,
        phoneNumber: c.phone,
        city: c.city,
        country: 'Ghana',
      },
    });
    seededCustomers.push(cust);
  }
  console.log(`✅ Seeded ${seededCustomers.length} Customer accounts.`);

  // 3. Definitions for the 5 Organizations
  const organizationsPayload = [
    {
      name: 'Apex Bank Ghana',
      type: 'Banking & Financial Services',
      description: 'Premier retail and commercial banking with branches across Greater Accra.',
      adminEmail: 'owner@queueless.com',
      adminName: 'Kofi Mensah (Apex MD)',
      branches: [
        {
          name: 'Airport City Branch',
          location: 'One Airport Square, Airport City, Accra',
          latitude: 5.6037,
          longitude: -0.1768,
          operatingHours: '08:30 - 16:30',
          manager: { email: 'manager@queueless.com', name: 'Ama Serwaa (Branch Manager)' },
          staff: { email: 'staff@queueless.com', name: 'Kwame Boateng (Senior Teller)' },
          services: [
            { name: 'Teller & Cash Services', description: 'Deposits, withdrawals, and foreign exchange', duration: 10, price: 0 },
            { name: 'Customer Service & Account Opening', description: 'New accounts, debit cards, internet banking', duration: 25, price: 0 },
            { name: 'Loan & Advisory Consultation', description: 'Personal, SME, and commercial credit lines', duration: 30, price: 0 },
          ],
        },
        {
          name: 'Osu Oxford Street Branch',
          location: 'Oxford Street, Osu, Accra',
          latitude: 5.5560,
          longitude: -0.1837,
          operatingHours: '08:30 - 17:00',
          manager: { email: 'osu.manager@queueless.com', name: 'Samuel Addo (Osu Manager)' },
          staff: { email: 'osu.staff@queueless.com', name: 'Grace Quaye (Customer Desk)' },
          services: [
            { name: 'Express Cash Transactions', description: 'Quick deposits and withdrawals', duration: 8, price: 0 },
            { name: 'General Inquiries & Card Services', description: 'Statements, card replacements, and inquiries', duration: 15, price: 0 },
          ],
        },
      ],
    },
    {
      name: 'St. Jude Specialist Hospital & Diagnostic Center',
      type: 'Healthcare & Medical Services',
      description: 'State-of-the-art specialist outpatient clinic and rapid diagnostic center.',
      adminEmail: 'clinic.admin@queueless.com',
      adminName: 'Dr. Evelyn Arthur (Medical Director)',
      branches: [
        {
          name: 'Ridge Medical Pavilion',
          location: 'Castle Road, Ridge, Accra',
          latitude: 5.5658,
          longitude: -0.1989,
          operatingHours: '08:00 - 18:00',
          manager: { email: 'clinic.manager@queueless.com', name: 'Dr. Bernard Danquah (Head of Clinic)' },
          staff: { email: 'clinic.staff@queueless.com', name: 'Nurse Sarah Baidoo (Triage Desk)' },
          services: [
            { name: 'General Outpatient Care (OPD)', description: 'Initial triage, vitals check, and general physician consult', duration: 15, price: 50 },
            { name: 'Specialist Medical Consultation', description: 'Cardiology, pediatrics, internal medicine', duration: 30, price: 150 },
            { name: 'Pharmacy & Medication Dispensing', description: 'Prescription fulfillment and drug advisory', duration: 10, price: 0 },
          ],
        },
        {
          name: 'East Legon Polyclinic',
          location: 'Lagos Avenue, East Legon, Accra',
          latitude: 5.6358,
          longitude: -0.1589,
          operatingHours: '08:00 - 17:30',
          manager: { email: 'legon.manager@queueless.com', name: 'Dr. Michael Antwi (Polyclinic Lead)' },
          staff: { email: 'pharmacy.staff@queueless.com', name: 'Kweku Appiah (Chief Dispenser)' },
          services: [
            { name: 'Pediatric & Well-Baby Clinic', description: 'Child growth monitoring and immunizations', duration: 20, price: 40 },
            { name: 'Diagnostic Blood & Imaging Tests', description: 'Full blood count, lipid profile, rapid malaria test', duration: 25, price: 80 },
          ],
        },
      ],
    },
    {
      name: 'Driver & Vehicle Licensing Authority (DVLA)',
      type: 'Government & Civic Administration',
      description: 'National regulatory agency for driver certification and motor vehicle roadworthiness.',
      adminEmail: 'gov.admin@queueless.com',
      adminName: 'Hon. Patrick Owusu (Director General)',
      branches: [
        {
          name: '37 Liberation Road Center',
          location: 'Liberation Road, 37 Military Area, Accra',
          latitude: 5.5891,
          longitude: -0.1834,
          operatingHours: '08:00 - 16:30',
          manager: { email: 'gov.manager@queueless.com', name: 'Nana Yeboah (Regional Supervisor)' },
          staff: { email: 'gov.staff@queueless.com', name: 'Rita Asare (Licensing Officer)' },
          services: [
            { name: 'Driver License Renewal & Smart Card', description: 'Eye test, biometric verification, and card issuance', duration: 15, price: 65 },
            { name: 'Vehicle Roadworthiness Inspection', description: 'Automated brake, suspension, and emissions testing', duration: 25, price: 100 },
            { name: 'Commercial Transport Licensing', description: 'Taxi, trotro, and ride-hailing vehicle permits', duration: 20, price: 85 },
          ],
        },
        {
          name: 'Tema Industrial Center',
          location: 'Harbour Road, Community 1, Tema',
          latitude: 5.6698,
          longitude: -0.0166,
          operatingHours: '08:00 - 16:00',
          manager: { email: 'tema.manager@queueless.com', name: 'Ibrahim Salifu (Harbour Station Lead)' },
          staff: { email: 'tema.staff@queueless.com', name: 'Isaac Donkor (Vehicle Inspector)' },
          services: [
            { name: 'New Vehicle Registration & Plates', description: 'Customs clearance inspection and plate stamping', duration: 30, price: 200 },
            { name: 'Heavy Duty Truck Permitting', description: 'Haulage container transport safety audit', duration: 25, price: 150 },
          ],
        },
      ],
    },
  ];

  // 4. Seed Organizations, Branches, Services, Queues, Admins, Managers, and Staff
  let orgIndex = 1;
  for (const orgData of organizationsPayload) {
    console.log(`\n🏢 [${orgIndex}/3] Processing Organization: "${orgData.name}"...`);

    // A. Upsert Organization
    let org = await prisma.organization.findFirst({
      where: { name: orgData.name },
      include: { branches: { include: { services: true } } },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: orgData.name,
          type: orgData.type,
          description: orgData.description,
        },
        include: { branches: { include: { services: true } } },
      });
      console.log(`   ✨ Created Organization: ${org.name}`);
    } else {
      console.log(`   ℹ️ Found existing Organization: ${org.name}`);
    }

    // Seed Organization-Specific Categories
    const categoriesByOrg: Record<string, Array<{ name: string; description: string }>> = {
      'Apex Bank Ghana': [
        { name: 'Account Opening & Tier Upgrade', description: 'Assistance with new accounts, biometric KYC, and tier limits' },
        { name: 'Debit / Credit Card Dispute', description: 'ATM retraction, POS failed debit, and unauthorized online charges' },
        { name: 'International Wire Transfer & Forex', description: 'SWIFT wire verification, FX exchange inquiries, and proof of payment' },
        { name: 'Cheque Clearing & Stop Orders', description: 'Cheque tracking, clearing disputes, and immediate stop-payment requests' },
        { name: 'Mortgage & Personal Loan Advisory', description: 'Loan eligibility, interest rate consultation, and repayment scheduling' },
      ],
      'St. Jude Specialist Hospital & Diagnostic Center': [
        { name: 'General Physician Consultation', description: 'Remote triage, symptoms review, and specialist referral' },
        { name: 'Pediatric & Well-Child Follow-up', description: 'Infant care, vaccination advice, and child growth assessment' },
        { name: 'Radiology & Lab Scan Review', description: 'Evaluation of MRI, CT, Ultrasound, and blood test results' },
        { name: 'Cardiology & Hypertension Care', description: 'Blood pressure review, ECG interpretation, and cardiovascular advice' },
        { name: 'Prescription Refill & Chronic Care', description: 'Medication management and chronic condition monitoring' },
      ],
      'Driver & Vehicle Licensing Authority (DVLA)': [
        { name: 'Driver License Renewal Support', description: 'Smart card replacement, expired license renewal, and biometric queries' },
        { name: 'Vehicle Title Transfer & Ownership', description: 'Documentation audit, logbook update, and ownership change' },
        { name: 'Lost License & Plate Replacement', description: 'Affidavit submission and replacement plate stamped processing' },
        { name: 'Roadworthiness Certificate Inquiries', description: 'Inspection booking, sticker validation, and compliance checks' },
        { name: 'Commercial Transport Permitting', description: 'Taxi, trotro, and ride-hailing driver badge renewals' },
      ],
    };

    const categoriesToSeed = categoriesByOrg[orgData.name] || [];
    for (const cat of categoriesToSeed) {
      const existingCat = await prisma.appointmentCategory.findFirst({
        where: { organizationId: org.id, name: cat.name },
      });
      if (!existingCat) {
        await prisma.appointmentCategory.create({
          data: {
            organizationId: org.id,
            name: cat.name,
            description: cat.description,
            isActive: true,
          },
        });
      }
    }
    console.log(`   🏷️ Seeded ${categoriesToSeed.length} tenant categories for ${org.name}`);

    // B. Create Organization Admin
    await prisma.user.upsert({
      where: { email: orgData.adminEmail },
      update: { role: Role.ORG_ADMIN, organizationId: org.id, fullName: orgData.adminName },
      create: {
        email: orgData.adminEmail,
        passwordHash: defaultPasswordHash,
        fullName: orgData.adminName,
        role: Role.ORG_ADMIN,
        organizationId: org.id,
        phoneNumber: `+23320000${orgIndex}01`,
      },
    });
    console.log(`   👤 Org Admin: ${orgData.adminEmail}`);

    // C. Branches & Services
    for (const branchData of orgData.branches) {
      let branch = await prisma.branch.findFirst({
        where: { organizationId: org.id, name: branchData.name },
        include: { services: true },
      });

      if (!branch) {
        branch = await prisma.branch.create({
          data: {
            organizationId: org.id,
            name: branchData.name,
            location: branchData.location,
            latitude: branchData.latitude,
            longitude: branchData.longitude,
            geofenceRadius: 150,
            operatingHours: branchData.operatingHours,
            qrCodeId: `QR-${orgData.name.substring(0, 4).toUpperCase()}-${branchData.name.substring(0, 3).toUpperCase()}`,
            isActive: true,
          },
          include: { services: true },
        });
        console.log(`      🏬 Created Branch: ${branch.name}`);
      }

      // Upsert Branch Manager
      const branchManager = await prisma.user.upsert({
        where: { email: branchData.manager.email },
        update: { role: Role.BRANCH_MANAGER, organizationId: org.id, fullName: branchData.manager.name },
        create: {
          email: branchData.manager.email,
          passwordHash: defaultPasswordHash,
          fullName: branchData.manager.name,
          role: Role.BRANCH_MANAGER,
          organizationId: org.id,
          phoneNumber: `+23320000${orgIndex}02`,
        },
      });

      await prisma.branch.update({
        where: { id: branch.id },
        data: { managers: { connect: { id: branchManager.id } } },
      });

      // Upsert Branch Staff
      await prisma.user.upsert({
        where: { email: branchData.staff.email },
        update: { 
          role: Role.STAFF, 
          organizationId: org.id, 
          staffBranchId: branch.id, 
          fullName: branchData.staff.name 
        },
        create: {
          email: branchData.staff.email,
          passwordHash: defaultPasswordHash,
          fullName: branchData.staff.name,
          role: Role.STAFF,
          organizationId: org.id,
          staffBranchId: branch.id,
          phoneNumber: `+23320000${orgIndex}03`,
        },
      });

      // Create Services & Queues
      for (const serviceData of branchData.services) {
        let service = branch.services.find((s) => s.name === serviceData.name);
        if (!service) {
          service = await prisma.service.create({
            data: {
              branchId: branch.id,
              name: serviceData.name,
              description: serviceData.description,
              duration: serviceData.duration,
              price: serviceData.price,
              isActive: true,
            },
          });
        }

        // Ensure Queue exists and is open
        let queue = await prisma.queue.findFirst({
          where: { branchId: branch.id, serviceId: service.id },
        });

        if (!queue) {
          queue = await prisma.queue.create({
            data: {
              branchId: branch.id,
              serviceId: service.id,
              status: QueueStatus.OPEN,
            },
          });
        }

        // Queue created clean: As per testing rules, customers are NOT auto-joined to queues.
      }

      // Seed a realistic upcoming appointment for this branch
      const apptCustomer = seededCustomers[(orgIndex + 3) % seededCustomers.length];
      const primaryService = (await prisma.service.findFirst({ where: { branchId: branch.id } }))!;
      
      const existingAppt = await prisma.appointment.findFirst({
        where: { branchId: branch.id, userId: apptCustomer.id },
      });

      if (!existingAppt && primaryService) {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + (orgIndex % 4) + 1);
        if (scheduledDate.getDay() === 0) scheduledDate.setDate(scheduledDate.getDate() + 1);
        scheduledDate.setHours(9 + (orgIndex % 5), 30, 0, 0);

        await prisma.appointment.create({
          data: {
            userId: apptCustomer.id,
            branchId: branch.id,
            serviceId: primaryService.id,
            scheduledTime: scheduledDate,
            status: AppointmentStatus.CONFIRMED,
            notes: `Confirmed consultation with ${branchData.name} team.`,
          },
        });
      }
    }

    orgIndex++;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Database Seeding Finished Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('All 3 Organizations Seeded:');
  console.log('1. 🏦 Apex Bank Ghana                     (Admin: owner@queueless.com     / password123)');
  console.log('2. 🏥 St. Jude Specialist Hospital        (Admin: clinic.admin@queueless.com / password123)');
  console.log('3. 🚗 Driver & Vehicle Licensing (DVLA)   (Admin: gov.admin@queueless.com    / password123)');
  console.log('\nStaff Credentials:');
  console.log('• Apex Bank Teller:        staff@queueless.com          / password123');
  console.log('• Clinic Triage Nurse:     clinic.staff@queueless.com   / password123');
  console.log('• DVLA Licensing Officer:  gov.staff@queueless.com      / password123');
  console.log('\nCustomer Credentials (10 Accounts):');
  console.log('• customer@queueless.com  (Abena Osei)');
  console.log('• customer1@queueless.com (Kwame Mensah)');
  console.log('• customer2@queueless.com (Fatima Al-Hassan)');
  console.log('• customer3@queueless.com (David Tetteh)');
  console.log('• customer4@queueless.com (Esi Annan)');
  console.log('• customer5@queueless.com (Emmanuel Sowah)');
  console.log('• customer6@queueless.com (Kofi Badu)');
  console.log('• customer7@queueless.com (Akosua Frimpong)');
  console.log('• customer8@queueless.com (Yaw Boateng)');
  console.log('• customer9@queueless.com (Adwoa Mansa)');
  console.log('  (Password for all customers: password123)');
  console.log('  (Note: No active queue entries seeded; clean queues ready for testing)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
