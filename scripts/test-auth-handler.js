const { PrismaClient } = require('@prisma/client');
const { betterAuth } = require('better-auth');
const { prismaAdapter } = require('better-auth/adapters/prisma');

const prisma = new PrismaClient();

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "holystar_tech_secure_auth_secret_key_2026",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://holystar.me",
    "https://www.holystar.me",
    "https://holystartech.me",
    "https://www.holystartech.me"
  ]
});

async function test() {
  console.log('Testing auth.handler directly with Request...');
  try {
    const req = new Request('http://localhost:3000/api/auth/get-session', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000',
        'Accept': 'application/json'
      }
    });

    console.log('Invoking auth.handler...');
    const res = await auth.handler(req);
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error in auth.handler:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
