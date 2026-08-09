import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.ADMIN_NAME || "Abonopaya Clement Ayebono";
  const adminEmail = process.env.ADMIN_EMAIL || "abonopayaclementayebono@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  console.log(`Checking initial administrator account: ${adminEmail}...`);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`[SEED] Administrator account (${adminEmail}) already exists. Skipping seed.`);
    return;
  }

  // Create administrator user record
  const user = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      emailVerified: true,
      role: "admin",
    },
  });

  // Create password authentication record
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: adminPassword, // Password will be managed by Better Auth password hash locally
    },
  });

  console.log(`[SEED] Administrator account for ${adminName} (${adminEmail}) created successfully!`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
