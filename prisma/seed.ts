import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.ADMIN_NAME || "Abonopaya Clement Ayebono";
  const adminEmail = (process.env.ADMIN_EMAIL || "abonopayaclementayebono@gmail.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  console.log(`Checking initial administrator account: ${adminEmail}...`);

  const hashedPassword = await hashPassword(adminPassword);

  let user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        emailVerified: true,
        role: "admin",
      },
    });
    console.log(`[SEED] Created administrator user record: ${user.id}`);
  }

  // Ensure password account record exists with valid Better Auth hash
  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
        accountId: user.id,
      },
    });
    console.log(`[SEED] Updated password hash for administrator account.`);
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
    console.log(`[SEED] Created password account record with Better Auth hash.`);
  }

  console.log(`[SEED] Administrator account (${adminEmail}) ready.`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
