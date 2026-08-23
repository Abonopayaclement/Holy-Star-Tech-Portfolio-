const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('=== CHECKING DATABASE CONNECTION & USER RECORDS ===');
  try {
    const userCount = await prisma.user.count();
    console.log('✅ Connection to database SUCCESSFUL! Total user count:', userCount);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accounts: {
          select: {
            id: true,
            providerId: true,
            password: true
          }
        },
        sessions: {
          select: {
            id: true,
            expiresAt: true
          }
        }
      }
    });

    console.log(`Found ${users.length} user records:`);
    users.forEach((u, i) => {
      console.log(`\nUser #${i + 1}:`);
      console.log(` - ID: ${u.id}`);
      console.log(` - Email: ${u.email}`);
      console.log(` - Name: ${u.name}`);
      console.log(` - Role: ${u.role}`);
      console.log(` - Active Sessions: ${u.sessions.length}`);
      console.log(` - Linked Accounts: ${u.accounts.length}`);
      u.accounts.forEach((a, j) => {
        const isHashed = a.password ? (a.password.includes(':') || a.password.startsWith('scrypt') || a.password.includes('$')) : false;
        console.log(`   Account #${j + 1}: providerId="${a.providerId}", hasPassword=${Boolean(a.password)}, passwordFormat=${isHashed ? 'Hashed (Better Auth scrypt format)' : 'Plain text or invalid format'}`);
      });
    });

    console.log(`\n=== CHECKING ENVIRONMENT VARIABLES (SAFE) ===`);
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl) {
      const parsed = new URL(dbUrl.replace('mysql://', 'http://'));
      console.log(`DATABASE_URL host: "${parsed.hostname}", port: "${parsed.port || 3306}", database: "${parsed.pathname.slice(1)}"`);
    } else {
      console.log('DATABASE_URL is not set!');
    }

    console.log(`BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? 'SET (length: ' + process.env.BETTER_AUTH_SECRET.length + ')' : 'NOT SET (using default fallback)'}`);
    console.log(`BETTER_AUTH_URL: "${process.env.BETTER_AUTH_URL || ''}"`);
    console.log(`NEXT_PUBLIC_APP_URL: "${process.env.NEXT_PUBLIC_APP_URL || ''}"`);
  } catch (err) {
    console.error('❌ Database connection or query error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
