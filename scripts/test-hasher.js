const { hashPassword, verifyPassword } = require('@better-auth/utils/password');

async function testHasher() {
  const hash = await hashPassword('MySecretPass123');
  console.log('Generated hash:', hash);
  const isValid = await verifyPassword(hash, 'MySecretPass123');
  console.log('Valid password test:', isValid);
  const isInvalid = await verifyPassword(hash, 'WrongPass');
  console.log('Invalid password test:', isInvalid);
}

testHasher();
