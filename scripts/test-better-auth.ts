import { auth } from "../lib/auth";

async function testBetterAuth() {
  console.log("=== TESTING BETTER AUTH INTERNALS ===");
  try {
    const ctx = await auth.$context;
    console.log("Better Auth initialized successfully.");
    console.log("Password hasher available:", Boolean(ctx.password));

    const testHash = await ctx.password.hash("testPassword123");
    console.log("Generated hash format:", testHash.slice(0, 30) + "...");
    const verifyResult = await ctx.password.verify({
      hash: testHash,
      password: "testPassword123",
    });
    console.log("Verified:", verifyResult);
  } catch (err) {
    console.error("Error:", err);
  }
}

testBetterAuth();
