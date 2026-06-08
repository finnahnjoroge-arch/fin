import { connectDB, disconnectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function reset() {
  const db = await connectDB();

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Usage: npx tsx scripts/reset-admin-password.ts <email> <password>");
    await disconnectDB();
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const selfTest = await bcrypt.compare(password, hash);
  console.log("bcrypt self-test (should be true):", selfTest);
  console.log("Generated hash:", hash);

  const result = await db.collection("adminusers").updateOne(
    { email },
    { $set: { password: hash } }
  );

  if (result.matchedCount === 0) {
    console.log("User not found:", email);
  } else {
    console.log("Password updated for:", email);
  }

  await disconnectDB();
}

reset().catch(async (err) => {
  console.error(err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
