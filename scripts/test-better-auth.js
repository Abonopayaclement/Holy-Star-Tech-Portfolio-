const { auth } = require('../lib/auth');

async function testBetterAuth() {
  console.log('=== TESTING BETTER AUTH INTERNALS ===');
  try {
    // 1. Check if Better Auth context and password hasher work
    const ctx = await auth.$context;
    console.log('Better Auth initialized successfully.');
    console.log('Password hasher available:', Boolean(ctx.password));
    
    // Let's test hashing a dummy string
    const testHash = await ctx.password.hash('testPassword123');
    console.log('Test hash generated format (first 25 chars):', testHash.slice(0, 25) + '...');
    const verifyResult = await ctx.password.verify({
      hash: testHash,
      password: 'testPassword123'
    });
    console.log('Test hash verified successfully:', verifyResult);

  } catch (err) {
    console.error('Better Auth test error:', err);
  }
}

testBetterAuth();
