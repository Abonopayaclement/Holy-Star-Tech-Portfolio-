const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('@better-auth/utils/password');

const prisma = new PrismaClient();

async function syncAdmin() {
  console.log('=== SYNCING ADMINISTRATOR ACCOUNT IN DATABASE ===');
  const adminEmail = (process.env.ADMIN_EMAIL || 'abonopayaclementayebono@gmail.com').trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME || 'Abonopaya Clement Ayebono';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  try {
    const hashedPassword = await hashPassword(adminPassword);
    console.log(`Hashing password for: ${adminEmail}`);

    let user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!user) {
      console.log('Creating new administrator user...');
      user = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          emailVerified: true,
          role: 'admin'
        }
      });
      console.log('✅ Created user record with ID:', user.id);
    } else {
      console.log('Found existing user record with ID:', user.id);
    }

    // Upsert or update Account record with the Better Auth password hash
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential'
      }
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          accountId: user.id
        }
      });
      console.log('✅ Updated existing account record with valid Better Auth password hash.');
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: 'credential',
          password: hashedPassword
        }
      });
      console.log('✅ Created new account record with valid Better Auth password hash.');
    }

    // Clean up any old invalid sessions to ensure clean state
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });
    console.log('✅ Reset stale sessions.');

    console.log('\n🎉 Administrator account is now 100% synchronized and ready for Better Auth login!');
  } catch (err) {
    console.error('❌ Error syncing admin account:', err);
  } finally {
    await prisma.$disconnect();
  }
}

syncAdmin();
