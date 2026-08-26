import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function seedAdmin() {
  const db = await connectDB();

  const email = process.argv[2] || "admin@example.com";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";

  const existing = await db.collection("adminusers").findOne({ email });
    if (existing) {
    console.log("Admin user already exists:", email);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.collection("adminusers").insertOne({
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
  });

  console.log("Admin user saved to DB:", result.insertedId.toString());
  console.log("Admin user created successfully:");
  console.log("  Email:", email);
  console.log("  Password:", password);
    console.log("  Name:", name);

  process.exit(0);
}

seedAdmin().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
